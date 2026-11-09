import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { calculateRankings } from '../features/ranking/services/rankingService';
import { calculateWeeklySummary } from '../features/ranking/services/weeklySummaryService';
import type { MuscleRanking, WeeklySummary } from '../features/ranking/types/ranking';
import {
  cleanupOrphanProfilePhotos,
  deleteAllProfilePhotos,
  removeProfilePhoto as clearProfilePhoto,
  saveProfilePhoto,
} from '../features/profile/services/profilePhotoService';
import type { Profile } from '../features/profile/types/profile';
import {
  cleanupOrphanPhotoFiles,
  removeWorkoutPhoto as removePhoto,
  saveWorkoutPhoto as savePhoto,
  type PhotoSource,
} from '../features/workout-photo/services/photoService';
import type { WorkoutPhoto } from '../features/workout-photo/types/photo';
import { createWorkout, deleteWorkout as removeWorkout, updateWorkout as editWorkout } from '../features/workouts/services/workoutService';
import type { Workout, WorkoutInput } from '../features/workouts/types/workout';
import { useToday } from '../hooks/useToday';
import { getDatabase } from '../services/database/database';
import { migrateLegacyWorkouts } from '../services/database/migrations/legacyWorkoutsMigration';
import { photoRepository } from '../services/database/repositories/photoRepository';
import { workoutRepository } from '../services/database/repositories/workoutRepository';
import { DatabaseError } from '../services/database/types';
import { deleteAllStoredPhotos } from '../services/filesystem/photoFileStorage';
import { clearAppStorage } from '../services/storage/appStorage';
import { StorageError } from '../services/storage/jsonStorage';
import { readLegacyWorkouts, removeLegacyWorkouts } from '../services/storage/legacyWorkoutStorage';
import { createDefaultProfile, profileStorage } from '../services/storage/profileStorage';
import { DEFAULT_SETTINGS, settingsStorage, type AppSettings } from '../services/storage/settingsStorage';
import type { DateKey } from '../types/common';
import { compareDateKeys } from '../utils/date';

/*
 * Estado global do app. Cada tecnologia tem um papel:
 *   AsyncStorage → perfil e preferências (chave-valor)
 *   SQLite       → treinos, grupos musculares, exercícios e metadados das fotos
 *   FileSystem   → arquivos das fotografias
 * O ranking nunca é salvo: é derivado dos treinos a cada alteração.
 */

type AppData = {
  profile: Profile;
  settings: AppSettings;
  workouts: Workout[];
  /** Foto de cada treino, indexada pelo id do treino. */
  photosByWorkoutId: Record<string, WorkoutPhoto>;
};

export type SaveWorkoutPhotoInput = {
  workoutId: string;
  source: PhotoSource;
  compositionUri: string;
};

export type AppDataContextValue = AppData & {
  today: DateKey;
  rankings: MuscleRanking[];
  weeklySummary: WeeklySummary;
  addWorkout: (input: WorkoutInput) => Promise<Workout>;
  updateWorkout: (id: string, input: WorkoutInput) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  /** Troca a foto de perfil pela imagem em `sourceUri` (câmera ou galeria). */
  updateProfilePhoto: (sourceUri: string) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
  updateSettings: (changes: Partial<AppSettings>) => Promise<void>;
  saveWorkoutPhoto: (input: SaveWorkoutPhotoInput) => Promise<WorkoutPhoto>;
  removeWorkoutPhoto: (workoutId: string) => Promise<void>;
  replaceAllData: (data: { profile: Profile; workouts: Workout[] }) => Promise<void>;
  resetAllData: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

/** Mais recente primeiro; empate resolvido pelo momento do registro. */
function sortWorkouts(workouts: Workout[]): Workout[] {
  return [...workouts].sort(
    (a, b) => compareDateKeys(b.date, a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

function indexPhotos(photos: WorkoutPhoto[]): Record<string, WorkoutPhoto> {
  return Object.fromEntries(photos.map((photo) => [photo.workoutId, photo]));
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

async function loadAppData(): Promise<AppData> {
  const db = await getDatabase();
  await migrateLegacyWorkouts(db, { read: readLegacyWorkouts, remove: removeLegacyWorkouts });

  const [profile, settings, workouts, photos] = await Promise.all([
    profileStorage.getOrCreate(),
    settingsStorage.get(),
    workoutRepository.findAll(db),
    photoRepository.findAll(db),
  ]);

  try {
    await cleanupOrphanPhotoFiles(db);
  } catch (error) {
    // Limpeza é só manutenção: uma falha aqui não pode impedir o app de abrir.
    console.warn('[photos] Falha ao limpar arquivos órfãos.', error);
  }
  cleanupOrphanProfilePhotos(profile.avatarPath);

  return { profile, settings, workouts: sortWorkouts(workouts), photosByWorkoutId: indexPhotos(photos) };
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof DatabaseError || error instanceof StorageError) return error.message;
  return 'Erro inesperado ao carregar os dados.';
}

type AppDataProviderProps = {
  children: ReactNode;
  /** Exibido enquanto os dados salvos são carregados. */
  loadingFallback: ReactNode;
  /** Exibido se a leitura inicial falhar. */
  renderError: (message: string, retry: () => void) => ReactNode;
};

/** Abre o banco, migra dados antigos e só então disponibiliza o contexto para o app. */
export function AppDataProvider({ children, loadingFallback, renderError }: AppDataProviderProps) {
  const [initialData, setInitialData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    loadAppData()
      .then((data) => {
        if (isActive) setInitialData(data);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        console.warn('[app] Falha ao carregar dados.', error);
        setLoadError(getLoadErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoadError(null);
    setAttempt((current) => current + 1);
  }, []);

  if (loadError) return <>{renderError(loadError, retry)}</>;
  if (!initialData) return <>{loadingFallback}</>;

  return <LoadedAppDataProvider initialData={initialData}>{children}</LoadedAppDataProvider>;
}

type LoadedAppDataProviderProps = {
  initialData: AppData;
  children: ReactNode;
};

/** Fluxo de cada alteração: UI → contexto → serviço → SQLite/AsyncStorage/arquivos → estado. */
function LoadedAppDataProvider({ initialData, children }: LoadedAppDataProviderProps) {
  const today = useToday();
  const [data, setData] = useState<AppData>(initialData);
  const { profile, settings, workouts, photosByWorkoutId } = data;

  const addWorkout = useCallback(async (input: WorkoutInput) => {
    const workout = await createWorkout(await getDatabase(), input);
    setData((current) => ({ ...current, workouts: sortWorkouts([...current.workouts, workout]) }));
    return workout;
  }, []);

  const updateWorkout = useCallback(
    async (id: string, input: WorkoutInput) => {
      const existing = workouts.find((workout) => workout.id === id);
      if (!existing) throw new Error('Treino não encontrado.');
      const updated = await editWorkout(await getDatabase(), existing, input);
      setData((current) => ({
        ...current,
        workouts: sortWorkouts(current.workouts.map((workout) => (workout.id === id ? updated : workout))),
      }));
    },
    [workouts],
  );

  const deleteWorkout = useCallback(async (id: string) => {
    await removeWorkout(await getDatabase(), id);
    setData((current) => ({
      ...current,
      workouts: current.workouts.filter((workout) => workout.id !== id),
      photosByWorkoutId: withoutKey(current.photosByWorkoutId, id),
    }));
  }, []);

  const updateProfileName = useCallback(
    async (name: string) => {
      const nextProfile = { ...profile, name: name.trim() };
      await profileStorage.save(nextProfile);
      setData((current) => ({ ...current, profile: nextProfile }));
    },
    [profile],
  );

  const updateProfilePhoto = useCallback(
    async (sourceUri: string) => {
      const nextProfile = await saveProfilePhoto(profile, sourceUri);
      setData((current) => ({ ...current, profile: nextProfile }));
    },
    [profile],
  );

  const removeProfilePhoto = useCallback(async () => {
    const nextProfile = await clearProfilePhoto(profile);
    setData((current) => ({ ...current, profile: nextProfile }));
  }, [profile]);

  /** Atualiza na hora (interruptores respondem sem atraso) e desfaz se a gravação falhar. */
  const updateSettings = useCallback(
    async (changes: Partial<AppSettings>) => {
      const previous = settings;
      const next = { ...settings, ...changes };
      setData((current) => ({ ...current, settings: next }));
      try {
        await settingsStorage.save(next);
      } catch (error) {
        setData((current) => ({ ...current, settings: previous }));
        throw error;
      }
    },
    [settings],
  );

  const saveWorkoutPhoto = useCallback(async ({ workoutId, source, compositionUri }: SaveWorkoutPhotoInput) => {
    const photo = await savePhoto(await getDatabase(), { workoutId, source, compositionUri });
    setData((current) => ({
      ...current,
      photosByWorkoutId: { ...current.photosByWorkoutId, [workoutId]: photo },
    }));
    return photo;
  }, []);

  const removeWorkoutPhoto = useCallback(async (workoutId: string) => {
    await removePhoto(await getDatabase(), workoutId);
    setData((current) => ({ ...current, photosByWorkoutId: withoutKey(current.photosByWorkoutId, workoutId) }));
  }, []);

  const replaceAllData = useCallback(async (next: { profile: Profile; workouts: Workout[] }) => {
    await workoutRepository.replaceAll(await getDatabase(), next.workouts);
    deleteAllStoredPhotos();
    await profileStorage.save(next.profile);
    cleanupOrphanProfilePhotos(next.profile.avatarPath);
    setData((current) => ({
      ...current,
      profile: next.profile,
      workouts: sortWorkouts(next.workouts),
      photosByWorkoutId: {},
    }));
  }, []);

  const resetAllData = useCallback(async () => {
    await workoutRepository.removeAll(await getDatabase());
    deleteAllStoredPhotos();
    deleteAllProfilePhotos();
    await clearAppStorage();
    const defaultProfile = createDefaultProfile();
    await profileStorage.save(defaultProfile);
    setData({ profile: defaultProfile, settings: DEFAULT_SETTINGS, workouts: [], photosByWorkoutId: {} });
  }, []);

  // Ranking e resumo são derivados: recalculados sempre que treinos, perfil ou a data mudam.
  const rankings = useMemo(
    () => calculateRankings({ workouts, profileStartDate: profile.startDate, today }),
    [workouts, profile.startDate, today],
  );

  const weeklySummary = useMemo(
    () => calculateWeeklySummary(rankings, workouts, profile.startDate, today),
    [rankings, workouts, profile.startDate, today],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      profile,
      settings,
      workouts,
      photosByWorkoutId,
      today,
      rankings,
      weeklySummary,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      updateProfileName,
      updateProfilePhoto,
      removeProfilePhoto,
      updateSettings,
      saveWorkoutPhoto,
      removeWorkoutPhoto,
      replaceAllData,
      resetAllData,
    }),
    [
      profile,
      settings,
      workouts,
      photosByWorkoutId,
      today,
      rankings,
      weeklySummary,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      updateProfileName,
      updateProfilePhoto,
      removeProfilePhoto,
      updateSettings,
      saveWorkoutPhoto,
      removeWorkoutPhoto,
      replaceAllData,
      resetAllData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** Uso interno dos hooks de domínio (useWorkouts, useRanking, useProfile, useSettings...). */
export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve ser usado dentro de <AppDataProvider>.');
  }
  return context;
}

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
import type { Profile } from '../features/profile/types/profile';
import type { Workout, WorkoutInput } from '../features/workouts/types/workout';
import { useToday } from '../hooks/useToday';
import { clearAppStorage } from '../services/storage/appStorage';
import { StorageError } from '../services/storage/jsonStorage';
import { createDefaultProfile, profileStorage } from '../services/storage/profileStorage';
import { workoutStorage } from '../services/storage/workoutStorage';
import type { DateKey } from '../types/common';
import { compareDateKeys } from '../utils/date';
import { generateId } from '../utils/id';

type AppData = {
  profile: Profile;
  workouts: Workout[];
};

export type AppDataContextValue = AppData & {
  today: DateKey;
  rankings: MuscleRanking[];
  weeklySummary: WeeklySummary;
  addWorkout: (input: WorkoutInput) => Promise<Workout>;
  updateWorkout: (id: string, input: WorkoutInput) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  replaceAllData: (data: AppData) => Promise<void>;
  resetAllData: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

/** Mais recente primeiro; empate resolvido pelo momento do registro. */
function sortWorkouts(workouts: Workout[]): Workout[] {
  return [...workouts].sort(
    (a, b) => compareDateKeys(b.date, a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

async function loadAppData(): Promise<AppData> {
  const [profile, workouts] = await Promise.all([profileStorage.getOrCreate(), workoutStorage.getAll()]);
  return { profile, workouts: sortWorkouts(workouts) };
}

type AppDataProviderProps = {
  children: ReactNode;
  /** Exibido enquanto os dados salvos são carregados. */
  loadingFallback: ReactNode;
  /** Exibido se a leitura inicial falhar. */
  renderError: (message: string, retry: () => void) => ReactNode;
};

/** Carrega os dados salvos e só então disponibiliza o contexto para o app. */
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
        setLoadError(error instanceof StorageError ? error.message : 'Erro inesperado ao carregar os dados.');
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

/**
 * Estado global do app após o carregamento. Toda alteração segue o fluxo
 * UI → contexto → serviço de armazenamento → estado; o ranking é apenas derivado.
 */
function LoadedAppDataProvider({ initialData, children }: LoadedAppDataProviderProps) {
  const today = useToday();
  const [data, setData] = useState<AppData>(initialData);
  const { profile, workouts } = data;

  const persistWorkouts = useCallback(
    async (nextWorkouts: Workout[]) => {
      const sorted = sortWorkouts(nextWorkouts);
      await workoutStorage.saveAll(sorted);
      setData((current) => ({ ...current, workouts: sorted }));
    },
    [],
  );

  const addWorkout = useCallback(
    async (input: WorkoutInput) => {
      const workout: Workout = { ...input, id: generateId(), createdAt: new Date().toISOString() };
      await persistWorkouts([...workouts, workout]);
      return workout;
    },
    [persistWorkouts, workouts],
  );

  const updateWorkout = useCallback(
    async (id: string, input: WorkoutInput) => {
      const existing = workouts.find((workout) => workout.id === id);
      if (!existing) throw new Error('Treino não encontrado.');
      const updated: Workout = { ...input, id, createdAt: existing.createdAt };
      await persistWorkouts(workouts.map((workout) => (workout.id === id ? updated : workout)));
    },
    [persistWorkouts, workouts],
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      await persistWorkouts(workouts.filter((workout) => workout.id !== id));
    },
    [persistWorkouts, workouts],
  );

  const updateProfileName = useCallback(
    async (name: string) => {
      const nextProfile = { ...profile, name: name.trim() };
      await profileStorage.save(nextProfile);
      setData((current) => ({ ...current, profile: nextProfile }));
    },
    [profile],
  );

  const replaceAllData = useCallback(async (next: AppData) => {
    const sorted = sortWorkouts(next.workouts);
    await Promise.all([profileStorage.save(next.profile), workoutStorage.saveAll(sorted)]);
    setData({ profile: next.profile, workouts: sorted });
  }, []);

  const resetAllData = useCallback(async () => {
    await clearAppStorage();
    const defaultProfile = createDefaultProfile();
    await profileStorage.save(defaultProfile);
    setData({ profile: defaultProfile, workouts: [] });
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
      workouts,
      today,
      rankings,
      weeklySummary,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      updateProfileName,
      replaceAllData,
      resetAllData,
    }),
    [
      profile,
      workouts,
      today,
      rankings,
      weeklySummary,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      updateProfileName,
      replaceAllData,
      resetAllData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** Uso interno dos hooks de domínio (useWorkouts, useRanking, useProfile). */
export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve ser usado dentro de <AppDataProvider>.');
  }
  return context;
}

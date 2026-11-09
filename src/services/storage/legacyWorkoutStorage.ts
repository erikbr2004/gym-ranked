import { isMuscleGroup } from '../../constants/muscleGroups';
import type { Workout } from '../../features/workouts/types/workout';
import { isValidDateKey } from '../../utils/date';
import { isRecord, readJson, removeKeys } from './jsonStorage';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Converte um treino salvo pela primeira etapa para o modelo atual.
 * Treinos antigos não tinham exercícios do catálogo, então recebem uma lista vazia.
 */
export function parseLegacyWorkout(value: unknown): Workout | null {
  if (!isRecord(value)) return null;
  const { id, title, date, muscleGroups, durationMinutes, notes, createdAt } = value;

  const isValid =
    typeof id === 'string' &&
    typeof title === 'string' &&
    isValidDateKey(date) &&
    Array.isArray(muscleGroups) &&
    muscleGroups.length > 0 &&
    muscleGroups.every(isMuscleGroup) &&
    typeof createdAt === 'string';
  if (!isValid) return null;

  return {
    id,
    title,
    date,
    muscleGroups,
    exercises: [],
    createdAt,
    ...(typeof durationMinutes === 'number' && durationMinutes > 0 ? { durationMinutes } : {}),
    ...(typeof notes === 'string' && notes.length > 0 ? { notes } : {}),
  };
}

/** Treinos antigos do AsyncStorage, ou `null` quando não existem dados antigos. */
export async function readLegacyWorkouts(): Promise<Workout[] | null> {
  const stored = await readJson(STORAGE_KEYS.LEGACY_WORKOUTS);
  if (stored === null) return null;
  if (!Array.isArray(stored)) return [];

  const workouts = stored.map(parseLegacyWorkout).filter((workout): workout is Workout => workout !== null);
  if (workouts.length < stored.length) {
    console.warn(`[migration] ${stored.length - workouts.length} treino(s) antigo(s) inválido(s) ignorado(s).`);
  }
  return workouts;
}

export async function removeLegacyWorkouts(): Promise<void> {
  await removeKeys([STORAGE_KEYS.LEGACY_WORKOUTS]);
}

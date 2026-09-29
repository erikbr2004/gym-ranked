import { isMuscleGroup } from '../../constants/muscleGroups';
import type { Workout } from '../../features/workouts/types/workout';
import { isValidDateKey } from '../../utils/date';
import { isRecord, readJson, writeJson } from './jsonStorage';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Contrato de acesso aos treinos. Para migrar para uma API/Firebase/Supabase,
 * basta criar outra implementação desta interface e trocá-la no AppDataContext.
 */
export type WorkoutRepository = {
  getAll(): Promise<Workout[]>;
  saveAll(workouts: Workout[]): Promise<void>;
};

function toWorkout(value: unknown): Workout | null {
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
    createdAt,
    ...(typeof durationMinutes === 'number' && durationMinutes > 0 ? { durationMinutes } : {}),
    ...(typeof notes === 'string' && notes.length > 0 ? { notes } : {}),
  };
}

export const workoutStorage: WorkoutRepository = {
  async getAll() {
    const stored = await readJson(STORAGE_KEYS.WORKOUTS);
    if (!Array.isArray(stored)) return [];

    // Registros corrompidos são descartados individualmente para não perder o restante.
    return stored.map(toWorkout).filter((workout): workout is Workout => workout !== null);
  },

  async saveAll(workouts) {
    await writeJson(STORAGE_KEYS.WORKOUTS, workouts);
  },
};

import type { MuscleGroup } from '../../../constants/muscleGroups';
import type { DateKey } from '../../../types/common';

export type Workout = {
  id: string;
  title: string;
  /** Dia em que o treino foi realizado (`YYYY-MM-DD`). */
  date: DateKey;
  muscleGroups: MuscleGroup[];
  durationMinutes?: number;
  notes?: string;
  /** Momento do registro (timestamp ISO 8601 completo). */
  createdAt: string;
};

/** Dados informados pelo usuário ao criar ou editar um treino. */
export type WorkoutInput = Omit<Workout, 'id' | 'createdAt'>;

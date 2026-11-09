import type { MuscleGroup } from '../../../constants/muscleGroups';
import type { DateKey } from '../../../types/common';

/**
 * Exercício do catálogo (API wger) associado a um treino. O nome é guardado
 * no momento da escolha para que o treino continue legível mesmo sem internet.
 */
export type WorkoutExercise = {
  /** Identificador do exercício na API wger. */
  exerciseId: number;
  name: string;
  /** Grupo do GymRank em que o exercício foi escolhido no catálogo. */
  muscleGroup: MuscleGroup | null;
};

/**
 * Todo treino registrado é um treino concluído: o registro acontece pelo botão
 * "Finalizar treino". Por isso o modelo não tem status de planejado/concluído.
 */
export type Workout = {
  id: string;
  title: string;
  /** Dia em que o treino foi realizado (`YYYY-MM-DD`). */
  date: DateKey;
  muscleGroups: MuscleGroup[];
  exercises: WorkoutExercise[];
  durationMinutes?: number;
  notes?: string;
  /** Momento do registro (timestamp ISO 8601 completo). */
  createdAt: string;
};

/** Dados informados pelo usuário ao criar ou editar um treino. */
export type WorkoutInput = Omit<Workout, 'id' | 'createdAt'>;

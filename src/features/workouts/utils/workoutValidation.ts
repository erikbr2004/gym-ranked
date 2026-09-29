import { sortMuscleGroups, type MuscleGroup } from '../../../constants/muscleGroups';
import type { DateKey } from '../../../types/common';
import { compareDateKeys, formatDate, parseDisplayDate } from '../../../utils/date';
import type { Workout, WorkoutInput } from '../types/workout';

export const WORKOUT_LIMITS = {
  TITLE_MAX_LENGTH: 40,
  NOTES_MAX_LENGTH: 300,
  DURATION_MAX_MINUTES: 600,
} as const;

/** Valores crus do formulário, exatamente como digitados. */
export type WorkoutFormValues = {
  title: string;
  dateText: string;
  muscleGroups: MuscleGroup[];
  durationText: string;
  notes: string;
};

export type WorkoutFormField = 'title' | 'date' | 'muscleGroups' | 'duration';
export type WorkoutFormErrors = Partial<Record<WorkoutFormField, string>>;

export type WorkoutValidationResult =
  | { isValid: true; input: WorkoutInput }
  | { isValid: false; errors: WorkoutFormErrors };

export function createEmptyFormValues(today: DateKey): WorkoutFormValues {
  return { title: '', dateText: formatDate(today), muscleGroups: [], durationText: '', notes: '' };
}

export function workoutToFormValues(workout: Workout): WorkoutFormValues {
  return {
    title: workout.title,
    dateText: formatDate(workout.date),
    muscleGroups: workout.muscleGroups,
    durationText: workout.durationMinutes?.toString() ?? '',
    notes: workout.notes ?? '',
  };
}

function validateDate(dateText: string, today: DateKey): { date?: DateKey; error?: string } {
  if (!dateText.trim()) return { error: 'Informe a data do treino.' };
  const date = parseDisplayDate(dateText);
  if (!date) return { error: 'Data inválida. Use o formato DD/MM/AAAA.' };
  if (compareDateKeys(date, today) > 0) return { error: 'A data não pode estar no futuro.' };
  return { date };
}

function validateDuration(durationText: string): { duration?: number; error?: string } {
  const trimmed = durationText.trim();
  if (!trimmed) return {};
  if (!/^\d+$/.test(trimmed)) return { error: 'Use apenas números inteiros.' };
  const duration = Number(trimmed);
  if (duration <= 0) return { error: 'A duração deve ser maior que zero.' };
  if (duration > WORKOUT_LIMITS.DURATION_MAX_MINUTES) {
    return { error: `A duração máxima é ${WORKOUT_LIMITS.DURATION_MAX_MINUTES} minutos.` };
  }
  return { duration };
}

export function validateWorkoutForm(values: WorkoutFormValues, today: DateKey): WorkoutValidationResult {
  const errors: WorkoutFormErrors = {};
  const title = values.title.trim();
  const notes = values.notes.trim();

  if (!title) errors.title = 'Dê um nome ao treino.';
  if (values.muscleGroups.length === 0) errors.muscleGroups = 'Selecione pelo menos um grupo muscular.';

  const { date, error: dateError } = validateDate(values.dateText, today);
  if (dateError) errors.date = dateError;

  const { duration, error: durationError } = validateDuration(values.durationText);
  if (durationError) errors.duration = durationError;

  if (Object.keys(errors).length > 0 || !date) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    input: {
      title,
      date,
      muscleGroups: sortMuscleGroups(values.muscleGroups),
      ...(duration !== undefined ? { durationMinutes: duration } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

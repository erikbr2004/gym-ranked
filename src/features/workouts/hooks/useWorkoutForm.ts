import { useCallback, useState } from 'react';

import type { MuscleGroup } from '../../../constants/muscleGroups';
import type { DateKey } from '../../../types/common';
import type { WorkoutInput } from '../types/workout';
import {
  validateWorkoutForm,
  type WorkoutFormErrors,
  type WorkoutFormField,
  type WorkoutFormValues,
} from '../utils/workoutValidation';

type TextField = Exclude<keyof WorkoutFormValues, 'muscleGroups'>;

const FIELD_ERROR_KEY: Partial<Record<TextField, WorkoutFormField>> = {
  title: 'title',
  dateText: 'date',
  durationText: 'duration',
};

/**
 * Estado do formulário de treino (criação e edição).
 * A tela decide o que fazer com o `WorkoutInput` validado.
 */
export function useWorkoutForm(initialValues: WorkoutFormValues, today: DateKey) {
  const [values, setValues] = useState<WorkoutFormValues>(initialValues);
  const [errors, setErrors] = useState<WorkoutFormErrors>({});

  const clearError = useCallback((field: WorkoutFormField) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const setField = useCallback(
    (field: TextField, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      const errorKey = FIELD_ERROR_KEY[field];
      if (errorKey) clearError(errorKey);
    },
    [clearError],
  );

  const toggleMuscleGroup = useCallback(
    (group: MuscleGroup) => {
      setValues((current) => ({
        ...current,
        muscleGroups: current.muscleGroups.includes(group)
          ? current.muscleGroups.filter((item) => item !== group)
          : [...current.muscleGroups, group],
      }));
      clearError('muscleGroups');
    },
    [clearError],
  );

  const selectMuscleGroup = useCallback(
    (group: MuscleGroup) => {
      setValues((current) =>
        current.muscleGroups.includes(group)
          ? current
          : { ...current, muscleGroups: [...current.muscleGroups, group] },
      );
      clearError('muscleGroups');
    },
    [clearError],
  );

  const reset = useCallback((nextValues: WorkoutFormValues) => {
    setValues(nextValues);
    setErrors({});
  }, []);

  /** Valida os valores atuais; retorna o treino pronto para salvar ou `null`. */
  const validate = useCallback((): WorkoutInput | null => {
    const result = validateWorkoutForm(values, today);
    if (!result.isValid) {
      setErrors(result.errors);
      return null;
    }
    setErrors({});
    return result.input;
  }, [values, today]);

  return { values, errors, setField, toggleMuscleGroup, selectMuscleGroup, reset, validate };
}

export type WorkoutFormController = ReturnType<typeof useWorkoutForm>;

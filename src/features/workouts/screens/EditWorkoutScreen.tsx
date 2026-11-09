import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '../../../components/EmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import type { MuscleGroup } from '../../../constants/muscleGroups';
import { spacing } from '../../../constants/theme';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { RootStackScreenProps } from '../../../navigation/navigationTypes';
import { getErrorMessage, showMessage } from '../../../utils/dialogs';
import { WorkoutForm } from '../components/WorkoutForm';
import { useWorkoutForm } from '../hooks/useWorkoutForm';
import type { Workout, WorkoutExercise } from '../types/workout';
import { workoutToFormValues } from '../utils/workoutValidation';

export function EditWorkoutScreen({ navigation, route }: RootStackScreenProps<'EditWorkout'>) {
  const { getWorkoutById } = useWorkouts();
  const { workoutId, pickedExercises } = route.params;
  const workout = getWorkoutById(workoutId);

  const openCatalog = (selected: WorkoutExercise[], initialGroup: MuscleGroup | undefined) => {
    navigation.navigate('ExerciseCatalog', {
      mode: 'select',
      target: { screen: 'EditWorkout', workoutId },
      selected,
      initialGroup,
    });
  };

  const clearPickedExercises = useCallback(() => {
    navigation.setParams({ pickedExercises: undefined });
  }, [navigation]);

  return (
    <ScreenContainer edges={[]}>
      {workout ? (
        <EditWorkoutForm
          workout={workout}
          pickedExercises={pickedExercises}
          onPickedExercisesApplied={clearPickedExercises}
          onOpenCatalog={openCatalog}
          onSaved={() => navigation.goBack()}
        />
      ) : (
        <EmptyState icon="alert-circle-outline" title="Treino não encontrado" message="Ele pode ter sido excluído." />
      )}
    </ScreenContainer>
  );
}

type EditWorkoutFormProps = {
  workout: Workout;
  pickedExercises: WorkoutExercise[] | undefined;
  onPickedExercisesApplied: () => void;
  onOpenCatalog: (selected: WorkoutExercise[], initialGroup: MuscleGroup | undefined) => void;
  onSaved: () => void;
};

function EditWorkoutForm({
  workout,
  pickedExercises,
  onPickedExercisesApplied,
  onOpenCatalog,
  onSaved,
}: EditWorkoutFormProps) {
  const { updateWorkout, today } = useWorkouts();
  const form = useWorkoutForm(workoutToFormValues(workout), today);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { applyPickedExercises } = form;

  // Ao voltar do catálogo, aplica os exercícios escolhidos e limpa o parâmetro.
  useEffect(() => {
    if (!pickedExercises) return;
    applyPickedExercises(pickedExercises);
    onPickedExercisesApplied();
  }, [pickedExercises, applyPickedExercises, onPickedExercisesApplied]);

  const handleSubmit = async () => {
    const input = form.validate();
    if (!input) return;

    setIsSubmitting(true);
    try {
      await updateWorkout(workout.id, input);
      showMessage('Treino atualizado', 'O ranking foi recalculado.');
      onSaved();
    } catch (error) {
      showMessage('Erro ao salvar', getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <WorkoutForm
          form={form}
          today={today}
          submitLabel="Salvar alterações"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onOpenCatalog={() => onOpenCatalog(form.values.exercises, form.values.muscleGroups[0])}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

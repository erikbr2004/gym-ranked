import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '../../../components/EmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { spacing } from '../../../constants/theme';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { RootStackScreenProps } from '../../../navigation/navigationTypes';
import { getErrorMessage, showMessage } from '../../../utils/dialogs';
import { WorkoutForm } from '../components/WorkoutForm';
import { useWorkoutForm } from '../hooks/useWorkoutForm';
import type { Workout } from '../types/workout';
import { workoutToFormValues } from '../utils/workoutValidation';

export function EditWorkoutScreen({ navigation, route }: RootStackScreenProps<'EditWorkout'>) {
  const { getWorkoutById } = useWorkouts();
  const workout = getWorkoutById(route.params.workoutId);

  return (
    <ScreenContainer edges={[]}>
      {workout ? (
        <EditWorkoutForm workout={workout} onSaved={() => navigation.goBack()} />
      ) : (
        <EmptyState icon="alert-circle-outline" title="Treino não encontrado" message="Ele pode ter sido excluído." />
      )}
    </ScreenContainer>
  );
}

type EditWorkoutFormProps = {
  workout: Workout;
  onSaved: () => void;
};

function EditWorkoutForm({ workout, onSaved }: EditWorkoutFormProps) {
  const { updateWorkout, today } = useWorkouts();
  const form = useWorkoutForm(workoutToFormValues(workout), today);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

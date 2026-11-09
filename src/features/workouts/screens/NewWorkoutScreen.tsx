import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { spacing } from '../../../constants/theme';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { MainTabScreenProps } from '../../../navigation/navigationTypes';
import { getErrorMessage, showMessage } from '../../../utils/dialogs';
import { WorkoutForm } from '../components/WorkoutForm';
import { useWorkoutForm } from '../hooks/useWorkoutForm';
import { createEmptyFormValues } from '../utils/workoutValidation';

export function NewWorkoutScreen({ navigation, route }: MainTabScreenProps<'NewWorkout'>) {
  const { addWorkout, today } = useWorkouts();
  const form = useWorkoutForm(createEmptyFormValues(today), today);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Trava imediata contra toque duplo: cada finalização gera exatamente um treino.
  const submittingRef = useRef(false);

  const preselectedGroup = route.params?.preselectedGroup;
  const pickedExercises = route.params?.pickedExercises;
  const { selectMuscleGroup, applyPickedExercises } = form;

  // Ao vir do Dashboard tocando em um grupo, marca o grupo e limpa o parâmetro.
  useEffect(() => {
    if (!preselectedGroup) return;
    selectMuscleGroup(preselectedGroup);
    navigation.setParams({ preselectedGroup: undefined });
  }, [preselectedGroup, selectMuscleGroup, navigation]);

  // Ao voltar do catálogo, aplica os exercícios escolhidos e limpa o parâmetro.
  useEffect(() => {
    if (!pickedExercises) return;
    applyPickedExercises(pickedExercises);
    navigation.setParams({ pickedExercises: undefined });
  }, [pickedExercises, applyPickedExercises, navigation]);

  const openCatalog = () => {
    navigation.navigate('ExerciseCatalog', {
      mode: 'select',
      target: { screen: 'NewWorkout' },
      selected: form.values.exercises,
      initialGroup: form.values.muscleGroups[0],
    });
  };

  const handleFinish = async () => {
    if (submittingRef.current) return;
    const input = form.validate();
    if (!input) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const workout = await addWorkout(input);
      form.reset(createEmptyFormValues(today));
      navigation.navigate('WorkoutCompleted', { workoutId: workout.id });
    } catch (error) {
      showMessage('Erro ao salvar', getErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppHeader title="Novo treino" subtitle="Registre e suba de rank" />
          <WorkoutForm
            form={form}
            today={today}
            submitLabel="Finalizar treino"
            onSubmit={handleFinish}
            isSubmitting={isSubmitting}
            onOpenCatalog={openCatalog}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

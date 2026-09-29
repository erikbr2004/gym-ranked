import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { getMuscleGroupLabel } from '../../../constants/muscleGroups';
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

  const preselectedGroup = route.params?.preselectedGroup;
  const { selectMuscleGroup } = form;

  // Ao vir do Dashboard tocando em um grupo, marca o grupo e limpa o parâmetro.
  useEffect(() => {
    if (!preselectedGroup) return;
    selectMuscleGroup(preselectedGroup);
    navigation.setParams({ preselectedGroup: undefined });
  }, [preselectedGroup, selectMuscleGroup, navigation]);

  const handleSubmit = async () => {
    const input = form.validate();
    if (!input) return;

    setIsSubmitting(true);
    try {
      await addWorkout(input);
      form.reset(createEmptyFormValues(today));
      const groupLabels = input.muscleGroups.map(getMuscleGroupLabel).join(', ');
      const verb = input.muscleGroups.length === 1 ? 'contabilizado' : 'contabilizados';
      showMessage('Treino salvo!', `${groupLabels} ${verb} na semana.`);
      navigation.navigate('Home');
    } catch (error) {
      showMessage('Erro ao salvar', getErrorMessage(error));
    } finally {
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
            submitLabel="Salvar treino"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
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

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import type { DateKey } from '../../../types/common';
import { addDays, formatDate } from '../../../utils/date';
import type { WorkoutFormController } from '../hooks/useWorkoutForm';
import { WORKOUT_LIMITS } from '../utils/workoutValidation';
import { FormField } from './FormField';
import { MuscleGroupSelector } from './MuscleGroupSelector';

type WorkoutFormProps = {
  form: WorkoutFormController;
  today: DateKey;
  submitLabel: string;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function WorkoutForm({ form, today, submitLabel, onSubmit, isSubmitting }: WorkoutFormProps) {
  const { values, errors, setField, toggleMuscleGroup } = form;
  const quickDates = [
    { label: 'Hoje', value: formatDate(today) },
    { label: 'Ontem', value: formatDate(addDays(today, -1)) },
  ];

  return (
    <View style={styles.form}>
      <FormField
        label="Treino"
        error={errors.title}
        inputProps={{
          value: values.title,
          onChangeText: (text) => setField('title', text),
          placeholder: 'Ex.: Push, Pull, Pernas...',
          maxLength: WORKOUT_LIMITS.TITLE_MAX_LENGTH,
          returnKeyType: 'next',
        }}
      />

      <FormField
        label="Data"
        error={errors.date}
        hint="Formato DD/MM/AAAA"
        inputProps={{
          value: values.dateText,
          onChangeText: (text) => setField('dateText', text),
          placeholder: 'DD/MM/AAAA',
          keyboardType: 'numbers-and-punctuation',
          maxLength: 10,
        }}
      />
      <View style={styles.quickDates}>
        {quickDates.map((option) => {
          const isActive = values.dateText.trim() === option.value;
          return (
            <Pressable
              key={option.label}
              onPress={() => setField('dateText', option.value)}
              accessibilityRole="button"
              accessibilityLabel={`Usar data de ${option.label.toLowerCase()}`}
              accessibilityState={{ selected: isActive }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FormField label="Grupos musculares" error={errors.muscleGroups}>
        <MuscleGroupSelector
          selected={values.muscleGroups}
          onToggle={toggleMuscleGroup}
          hasError={Boolean(errors.muscleGroups)}
        />
      </FormField>

      <FormField
        label="Duração em minutos"
        optional
        error={errors.duration}
        inputProps={{
          value: values.durationText,
          onChangeText: (text) => setField('durationText', text),
          placeholder: 'Ex.: 60',
          keyboardType: 'number-pad',
          maxLength: 3,
        }}
      />

      <FormField
        label="Observações"
        optional
        inputProps={{
          value: values.notes,
          onChangeText: (text) => setField('notes', text),
          placeholder: 'Cargas, sensações, recordes...',
          multiline: true,
          maxLength: WORKOUT_LIMITS.NOTES_MAX_LENGTH,
        }}
      />

      <AppButton label={submitLabel} onPress={onSubmit} loading={isSubmitting} icon="checkmark-circle-outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xl,
  },
  quickDates: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.md,
  },
  chip: {
    minHeight: sizes.touchTarget - 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chipTextActive: {
    color: colors.primary,
  },
});

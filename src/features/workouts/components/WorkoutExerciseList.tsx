import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { getMuscleGroupLabel, MUSCLE_GROUPS } from '../../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import type { WorkoutExercise } from '../types/workout';

type WorkoutExerciseListProps = {
  exercises: readonly WorkoutExercise[];
  /** Quando informado, cada item ganha um botão para removê-lo. */
  onRemove?: (exerciseId: number) => void;
};

/** Exercícios do catálogo associados ao treino. */
export function WorkoutExerciseList({ exercises, onRemove }: WorkoutExerciseListProps) {
  if (exercises.length === 0) return null;

  return (
    <View style={styles.list}>
      {exercises.map((exercise) => (
        <View key={exercise.exerciseId} style={styles.item}>
          <MaterialCommunityIcons
            name={exercise.muscleGroup ? MUSCLE_GROUPS[exercise.muscleGroup].icon : 'dumbbell'}
            size={sizes.iconMd}
            color={colors.primary}
          />
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={2}>
              {exercise.name}
            </Text>
            {exercise.muscleGroup && <Text style={styles.group}>{getMuscleGroupLabel(exercise.muscleGroup)}</Text>}
          </View>
          {onRemove && (
            <Pressable
              onPress={() => onRemove(exercise.exerciseId)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${exercise.name}`}
              style={styles.removeButton}
            >
              <Ionicons name="close" size={sizes.iconMd} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  texts: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  group: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  removeButton: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

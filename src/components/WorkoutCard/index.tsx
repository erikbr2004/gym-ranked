import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getMuscleGroupLabel } from '../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../constants/theme';
import type { Workout } from '../../features/workouts/types/workout';
import { formatDate } from '../../utils/date';
import { MuscleGroupTag } from '../MuscleGroupTag';

type WorkoutCardProps = {
  workout: Workout;
  onPress: () => void;
  onDelete?: () => void;
};

export function WorkoutCard({ workout, onPress, onDelete }: WorkoutCardProps) {
  const groupsDescription = workout.muscleGroups.map(getMuscleGroupLabel).join(', ');

  return (
    // Área principal e botão de excluir são irmãos: botões aninhados
    // confundem leitores de tela e geram HTML inválido no web.
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Treino ${workout.title}, ${formatDate(workout.date)}, ${groupsDescription}`}
        accessibilityHint="Abre os detalhes do treino"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Text style={styles.title} numberOfLines={1}>
          {workout.title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(workout.date)}</Text>
          {workout.durationMinutes !== undefined && (
            <>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{workout.durationMinutes} min</Text>
            </>
          )}
        </View>
        <View style={styles.tags}>
          {workout.muscleGroups.map((group) => (
            <MuscleGroupTag key={group} muscleGroup={group} />
          ))}
        </View>
      </Pressable>

      {onDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Excluir treino ${workout.title}`}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={sizes.iconMd} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginRight: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  deleteButton: {
    width: sizes.touchTarget + 8,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
});

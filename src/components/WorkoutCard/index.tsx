import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  /** O treino tem foto vinculada (exibe o indicador). */
  hasPhoto?: boolean;
  /** Miniatura da imagem gerada, quando o arquivo existe no aparelho. */
  photoThumbnailUri?: string;
};

export function WorkoutCard({ workout, onPress, onDelete, hasPhoto = false, photoThumbnailUri }: WorkoutCardProps) {
  const groupsDescription = workout.muscleGroups.map(getMuscleGroupLabel).join(', ');
  const photoDescription = hasPhoto ? ', com foto' : '';

  return (
    // Área principal e botão de excluir são irmãos: botões aninhados
    // confundem leitores de tela e geram HTML inválido no web.
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Treino ${workout.title}, ${formatDate(workout.date)}, ${groupsDescription}${photoDescription}`}
        accessibilityHint="Abre os detalhes do treino"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        {photoThumbnailUri && (
          <Image source={{ uri: photoThumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
        )}
        <View style={styles.texts}>
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
            {hasPhoto && <Ionicons name="camera" size={14} color={colors.primary} accessibilityLabel="Com foto" />}
          </View>
          <View style={styles.tags}>
            {workout.muscleGroups.map((group) => (
              <MuscleGroupTag key={group} muscleGroup={group} />
            ))}
          </View>
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

const THUMBNAIL_WIDTH = 50;

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
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    // Mesma proporção 9:16 da imagem gerada.
    height: (THUMBNAIL_WIDTH * 16) / 9,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  texts: {
    flex: 1,
    gap: spacing.sm,
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

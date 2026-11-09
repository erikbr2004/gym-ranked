import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, fontSize, fontWeight, radius, sizes, spacing, withAlpha } from '../../../constants/theme';
import type { Exercise } from '../types/exercise';

type ExerciseCardProps = {
  exercise: Exercise;
  expanded: boolean;
  onToggleExpanded: (exerciseId: number) => void;
  /** Presente apenas no modo de seleção (adicionar ao treino). */
  selected?: boolean;
  onToggleSelected?: (exercise: Exercise) => void;
};

function ExerciseCardComponent({ exercise, expanded, onToggleExpanded, selected, onToggleSelected }: ExerciseCardProps) {
  const isSelectable = onToggleSelected !== undefined;
  const summary = [exercise.category, ...exercise.equipment].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onToggleExpanded(exercise.id)}
          accessibilityRole="button"
          accessibilityLabel={`${exercise.name}. ${expanded ? 'Recolher detalhes' : 'Ver detalhes'}`}
          accessibilityState={{ expanded }}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        >
          <View style={styles.thumbnail}>
            {exercise.imageUrl ? (
              <Image
                source={{ uri: exercise.imageUrl }}
                style={styles.thumbnailImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <MaterialCommunityIcons name="dumbbell" size={sizes.iconLg} color={colors.textSubtle} />
            )}
          </View>
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={2}>
              {exercise.name}
            </Text>
            {exercise.englishName ? (
              <Text style={styles.englishName} numberOfLines={1}>
                {exercise.englishName}
              </Text>
            ) : null}
            {summary.length > 0 && (
              <Text style={styles.summary} numberOfLines={1}>
                {summary}
              </Text>
            )}
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={sizes.iconMd} color={colors.textSubtle} />
        </Pressable>

        {isSelectable && (
          <Pressable
            onPress={() => onToggleSelected(exercise)}
            hitSlop={6}
            accessibilityRole="checkbox"
            accessibilityLabel={`Adicionar ${exercise.name} ao treino`}
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}
          >
            <Ionicons
              name={selected ? 'checkmark-circle' : 'add-circle-outline'}
              size={sizes.iconLg}
              color={selected ? colors.primary : colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={styles.details}>
          {exercise.muscles.length > 0 && (
            <DetailLine label="Músculos principais" value={exercise.muscles.join(', ')} />
          )}
          {exercise.secondaryMuscles.length > 0 && (
            <DetailLine label="Secundários" value={exercise.secondaryMuscles.join(', ')} />
          )}
          <Text style={styles.description}>
            {exercise.description ?? 'A API não fornece descrição para este exercício.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

/** Memoizado: a lista pode ter centenas de itens durante a busca. */
export const ExerciseCard = memo(ExerciseCardComponent);

const THUMBNAIL_SIZE = 56;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.06),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.imageBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  englishName: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
  },
  summary: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  selectButton: {
    width: sizes.touchTarget + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  details: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  detailLine: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  detailLabel: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
});

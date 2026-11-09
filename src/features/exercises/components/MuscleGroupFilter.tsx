import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MUSCLE_GROUP_IDS, MUSCLE_GROUPS, type MuscleGroup } from '../../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, sizes, spacing, withAlpha } from '../../../constants/theme';

type MuscleGroupFilterProps = {
  selected: MuscleGroup;
  onSelect: (group: MuscleGroup) => void;
};

/** Filtro horizontal pelos grupos musculares do GymRank. */
export function MuscleGroupFilter({ selected, onSelect }: MuscleGroupFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityRole="tablist"
    >
      {MUSCLE_GROUP_IDS.map((group) => {
        const isSelected = group === selected;
        const { label, icon } = MUSCLE_GROUPS[group];
        return (
          <Pressable
            key={group}
            onPress={() => onSelect(group)}
            accessibilityRole="tab"
            accessibilityLabel={`Exercícios de ${label}`}
            accessibilityState={{ selected: isSelected }}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <MaterialCommunityIcons name={icon} size={sizes.iconSm} color={isSelected ? colors.primary : colors.textMuted} />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchTarget - 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  labelSelected: {
    color: colors.text,
  },
});

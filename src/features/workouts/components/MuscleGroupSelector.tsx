import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { MUSCLE_GROUP_IDS, MUSCLE_GROUPS, type MuscleGroup } from '../../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, sizes, spacing, withAlpha } from '../../../constants/theme';

type MuscleGroupSelectorProps = {
  selected: readonly MuscleGroup[];
  onToggle: (group: MuscleGroup) => void;
  hasError?: boolean;
};

export function MuscleGroupSelector({ selected, onToggle, hasError = false }: MuscleGroupSelectorProps) {
  return (
    <View style={styles.grid} accessibilityRole="list">
      {MUSCLE_GROUP_IDS.map((group) => {
        const isSelected = selected.includes(group);
        const { label, icon } = MUSCLE_GROUPS[group];

        return (
          <Pressable
            key={group}
            onPress={() => onToggle(group)}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{ checked: isSelected }}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              hasError && !isSelected && styles.optionError,
              pressed && styles.optionPressed,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={sizes.iconMd}
              color={isSelected ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={sizes.iconMd}
              color={isSelected ? colors.primary : colors.textSubtle}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: sizes.touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  optionError: {
    borderColor: withAlpha(colors.danger, 0.6),
  },
  optionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  label: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  labelSelected: {
    color: colors.text,
  },
});

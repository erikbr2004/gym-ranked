import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MUSCLE_GROUPS, type MuscleGroup } from '../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';

type MuscleGroupTagProps = {
  muscleGroup: MuscleGroup;
};

export function MuscleGroupTag({ muscleGroup }: MuscleGroupTagProps) {
  const { label, icon } = MUSCLE_GROUPS[muscleGroup];

  return (
    <View style={styles.tag}>
      <MaterialCommunityIcons name={icon} size={13} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

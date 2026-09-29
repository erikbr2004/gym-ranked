import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../constants/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ComponentProps<typeof Ionicons>['name'];
  accentColor?: string;
};

export function StatCard({ label, value, icon, accentColor = colors.primary }: StatCardProps) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={sizes.iconMd} color={accentColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});

import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, fontWeight, spacing } from '../../constants/theme';
import { AppButton } from '../AppButton';

type IconName = ComponentProps<typeof Ionicons>['name'];

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionIcon = 'add-circle-outline',
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <View style={styles.action}>
          <AppButton label={actionLabel} onPress={onAction} icon={actionIcon} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});

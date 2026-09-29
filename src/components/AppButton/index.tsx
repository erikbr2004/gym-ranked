import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
};

const VARIANT_COLORS: Record<Variant, { background: string; pressed: string; text: string; border: string }> = {
  primary: { background: colors.primary, pressed: colors.primaryPressed, text: colors.onPrimary, border: colors.primary },
  secondary: { background: colors.surfaceAlt, pressed: colors.surfacePressed, text: colors.text, border: colors.border },
  danger: { background: 'transparent', pressed: colors.surfacePressed, text: colors.danger, border: colors.danger },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  accessibilityHint,
}: AppButtonProps) {
  const palette = VARIANT_COLORS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? palette.pressed : palette.background, borderColor: palette.border },
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          icon && <Ionicons name={icon} size={sizes.iconMd} color={palette.text} />
        )}
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.touchTarget + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

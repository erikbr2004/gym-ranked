import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** Conteúdo customizado no lugar do TextInput padrão. */
  children?: ReactNode;
  inputProps?: TextInputProps;
};

export function FormField({ label, error, hint, optional = false, children, inputProps }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> (opcional)</Text>}
      </Text>
      {children ?? (
        <TextInput
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          accessibilityLabel={label}
          {...inputProps}
          style={[styles.input, inputProps?.multiline && styles.multiline, error && styles.inputError]}
        />
      )}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        hint && <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optional: {
    color: colors.textSubtle,
    fontWeight: fontWeight.medium,
    textTransform: 'none',
  },
  input: {
    minHeight: sizes.touchTarget + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.md,
  },
  multiline: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: fontSize.sm,
  },
});

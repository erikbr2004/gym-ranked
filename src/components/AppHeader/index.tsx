import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, spacing } from '../../constants/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  /** Conteúdo opcional alinhado à direita (avatar, botão etc.). */
  right?: ReactNode;
};

export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  texts: {
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
  },
});

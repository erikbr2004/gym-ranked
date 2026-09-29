import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../../constants/theme';
import type { WeeklyResult } from '../types/ranking';

type WeekStreakDotsProps = {
  /** Resultados da mais antiga para a mais recente. */
  results: readonly WeeklyResult[];
  maxWeeks?: number;
};

/** Mostra visualmente as últimas semanas: treinada, perdida ou em andamento. */
export function WeekStreakDots({ results, maxWeeks = 8 }: WeekStreakDotsProps) {
  const recent = results.slice(-maxWeeks);
  if (recent.length === 0) return null;

  const trainedCount = recent.filter((result) => result.trained).length;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Treinado em ${trainedCount} das últimas ${recent.length} semanas`}
    >
      <Text style={styles.label}>Últimas semanas</Text>
      <View style={styles.dots}>
        {recent.map((result) => (
          <View
            key={result.weekKey}
            style={[
              styles.dot,
              result.trained ? styles.trained : styles.missed,
              result.demoted && styles.demoted,
              !result.isComplete && styles.current,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const DOT_SIZE = 10;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
  },
  trained: {
    backgroundColor: colors.success,
  },
  missed: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoted: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  current: {
    borderWidth: 2,
    borderColor: colors.text,
  },
});

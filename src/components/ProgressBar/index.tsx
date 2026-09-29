import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../../constants/theme';

type ProgressBarProps = {
  /** Valor entre 0 e 1. */
  progress: number;
  color?: string;
  height?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({ progress, color = colors.primary, height = 6, accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

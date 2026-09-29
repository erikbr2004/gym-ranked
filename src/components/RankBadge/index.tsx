import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { RankName } from '../../constants/rankingConfig';
import { colors, fontSize, fontWeight, radius, sizes, spacing, withAlpha } from '../../constants/theme';
import { getRankVisual } from '../../features/ranking/utils/rankVisuals';

type RankBadgeProps = {
  rank: RankName;
  /** Quando informado, exibe a pontuação ao lado do nome do rank. */
  points?: number;
  size?: 'sm' | 'md';
};

export function RankBadge({ rank, points, size = 'md' }: RankBadgeProps) {
  const { color, icon } = getRankVisual(rank);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSmall && styles.badgeSmall,
        { borderColor: withAlpha(color, 0.5), backgroundColor: withAlpha(color, 0.12) },
      ]}
      accessibilityLabel={points === undefined ? `Rank ${rank}` : `Rank ${rank}, ${points} pontos`}
    >
      <MaterialCommunityIcons name={icon} size={isSmall ? sizes.iconSm - 2 : sizes.iconSm} color={color} />
      <Text style={[styles.label, isSmall && styles.labelSmall, { color }]}>{rank}</Text>
      {points !== undefined && <Text style={[styles.points, isSmall && styles.labelSmall]}>{points} pts</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: spacing.xxs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: fontSize.xs,
  },
  points: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});

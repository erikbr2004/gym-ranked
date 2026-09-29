import { StyleSheet, Text, View } from 'react-native';

import { RankBadge } from '../../../components/RankBadge';
import { RANK_TIERS, RANKING_RULES } from '../../../constants/rankingConfig';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../constants/theme';
import { getRankRange } from '../utils/rankUtils';

const RULES = [
  `+${RANKING_RULES.WEEKLY_TRAINED_REWARD} pts por grupo treinado na semana (vale 1x por semana)`,
  `−${RANKING_RULES.WEEKLY_MISSED_PENALTY} pts por semana completa sem treinar o grupo`,
  `${RANKING_RULES.MISSED_WEEKS_FOR_DEMOTION} semanas seguidas sem treino = rebaixamento de rank`,
  'A semana atual nunca é penalizada antes de terminar',
];

/** Legenda com as regras e a faixa de pontos de cada rank. */
export function RankingRules() {
  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Como funciona
      </Text>
      {RULES.map((rule) => (
        <Text key={rule} style={styles.rule}>
          • {rule}
        </Text>
      ))}

      <Text style={[styles.title, styles.tiersTitle]} accessibilityRole="header">
        Ranks
      </Text>
      <View style={styles.tiers}>
        {RANK_TIERS.map((tier) => {
          const { min, max } = getRankRange(tier.name);
          return (
            <View key={tier.name} style={styles.tier}>
              <RankBadge rank={tier.name} size="sm" />
              <Text style={styles.range}>{max === null ? `${min}+ pts` : `${min}–${max} pts`}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  tiersTitle: {
    marginTop: spacing.md,
  },
  rule: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  tiers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tier: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  range: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});

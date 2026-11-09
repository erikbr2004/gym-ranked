import { StyleSheet, Text, View } from 'react-native';

import { RankBadge } from '../../../components/RankBadge';
import { RANK_TIERS, RANKING_RULES } from '../../../constants/rankingConfig';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../constants/theme';
import { getRankRange } from '../utils/rankUtils';

const { WEEKLY_TRAINED_REWARD, STREAK_BONUS_PER_WEEK, STREAK_BONUS_MAX, MISSED_WEEKS_FOR_DEMOTION } = RANKING_RULES;
/** Semana seguida em que o bônus atinge o limite (com +5 até +10: a 3ª). */
const STREAK_MAX_WEEK = Math.ceil(STREAK_BONUS_MAX / STREAK_BONUS_PER_WEEK) + 1;
const LOWEST_PENALTY = RANK_TIERS[0].missedWeekPenalty;
const HIGHEST_PENALTY = RANK_TIERS[RANK_TIERS.length - 1].missedWeekPenalty;

const RULES = [
  `+${WEEKLY_TRAINED_REWARD} pts por grupo treinado na semana (vale 1x por semana)`,
  `Sequência: +${STREAK_BONUS_PER_WEEK} pts na 2ª semana seguida e +${STREAK_BONUS_MAX} a partir da ${STREAK_MAX_WEEK}ª`,
  `Semana completa sem treinar o grupo: −${LOWEST_PENALTY} a −${HIGHEST_PENALTY} pts, conforme o rank`,
  `${MISSED_WEEKS_FOR_DEMOTION} semanas seguidas sem treino = rebaixamento de rank`,
  'Quanto maior o rank, mais pontos para subir e mais caro faltar',
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
              <Text style={styles.penalty}>Faltar: −{tier.missedWeekPenalty} pts</Text>
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
  penalty: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ProgressBar } from '../../../components/ProgressBar';
import { RankBadge } from '../../../components/RankBadge';
import { MUSCLE_GROUPS } from '../../../constants/muscleGroups';
import { RANKING_RULES } from '../../../constants/rankingConfig';
import { colors, fontSize, fontWeight, radius, spacing, withAlpha } from '../../../constants/theme';
import type { MuscleRanking } from '../types/ranking';
import { getRankIndex, getRankProgress } from '../utils/rankUtils';
import { getRankVisual } from '../utils/rankVisuals';
import { WeekStreakDots } from './WeekStreakDots';

type RankingListItemProps = {
  ranking: MuscleRanking;
  position: number;
};

function describeMissedWeeks(missedWeeks: number, hasLowerRank: boolean): string {
  const weeksLabel = missedWeeks === 1 ? 'semana' : 'semanas';
  const untilDemotion =
    RANKING_RULES.MISSED_WEEKS_FOR_DEMOTION - (missedWeeks % RANKING_RULES.MISSED_WEEKS_FOR_DEMOTION);
  const warning = hasLowerRank && untilDemotion === 1 ? ' · risco de rebaixamento' : '';
  return `${missedWeeks} ${weeksLabel} sem treino${warning}`;
}

export function RankingListItem({ ranking, position }: RankingListItemProps) {
  const { label, icon } = MUSCLE_GROUPS[ranking.muscleGroup];
  const { color } = getRankVisual(ranking.rank);
  const progress = getRankProgress(ranking.points);

  const progressText =
    progress.next && progress.pointsToNext !== null
      ? `Faltam ${progress.pointsToNext} pts para ${progress.next}`
      : 'Rank máximo alcançado';

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <Text style={styles.position}>#{position}</Text>
        <View style={[styles.iconWrapper, { backgroundColor: withAlpha(color, 0.15) }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.name}>{label}</Text>
          <RankBadge rank={ranking.rank} size="sm" />
        </View>
        <View style={styles.pointsArea}>
          <Text style={styles.points}>{ranking.points}</Text>
          <Text style={styles.pointsUnit}>pontos</Text>
        </View>
      </View>

      <View style={styles.progressArea}>
        <ProgressBar
          progress={progress.progress}
          color={color}
          accessibilityLabel={`${label}: ${progressText}`}
        />
        <Text style={styles.progressText}>{progressText}</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.status}>
          <Ionicons
            name={ranking.trainedThisWeek ? 'checkmark-circle' : 'time-outline'}
            size={16}
            color={ranking.trainedThisWeek ? colors.success : colors.warning}
          />
          <Text style={[styles.statusText, { color: ranking.trainedThisWeek ? colors.success : colors.warning }]}>
            {ranking.trainedThisWeek ? 'Semana cumprida' : 'Pendente esta semana'}
          </Text>
        </View>
        {ranking.consecutiveMissedWeeks > 0 && (
          <Text style={styles.missed}>{describeMissedWeeks(ranking.consecutiveMissedWeeks, getRankIndex(ranking.rank) > 0)}</Text>
        )}
      </View>

      <WeekStreakDots results={ranking.weeklyResults} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  position: {
    color: colors.textSubtle,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    minWidth: 24,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  pointsArea: {
    alignItems: 'flex-end',
  },
  points: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
  },
  pointsUnit: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  progressArea: {
    gap: spacing.xs,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  missed: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { MUSCLE_GROUPS } from '../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, spacing, withAlpha } from '../../constants/theme';
import type { MuscleRanking } from '../../features/ranking/types/ranking';
import { getRankVisual } from '../../features/ranking/utils/rankVisuals';
import { RankBadge } from '../RankBadge';

type MuscleGroupCardProps = {
  ranking: MuscleRanking;
  onPress: () => void;
};

export function MuscleGroupCard({ ranking, onPress }: MuscleGroupCardProps) {
  const { label, icon } = MUSCLE_GROUPS[ranking.muscleGroup];
  const { color } = getRankVisual(ranking.rank);
  const statusText = ranking.trainedThisWeek ? 'Concluído' : 'Pendente';
  const statusColor = ranking.trainedThisWeek ? colors.success : colors.warning;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: rank ${ranking.rank}, ${ranking.points} pontos, ${statusText} esta semana`}
      accessibilityHint={ranking.trainedThisWeek ? 'Registrar outro treino' : 'Registrar treino deste grupo'}
      style={({ pressed }) => [styles.card, { borderColor: withAlpha(color, 0.35) }, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: withAlpha(color, 0.15) }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Ionicons
          name={ranking.trainedThisWeek ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={statusColor}
        />
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {label}
      </Text>
      <RankBadge rank={ranking.rank} size="sm" />
      <Text style={styles.points}>
        {ranking.points} <Text style={styles.pointsUnit}>pts</Text>
      </Text>
      <Text style={[styles.status, { color: statusColor }]}>{statusText} esta semana</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
    gap: spacing.xs + 2,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  points: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
  },
  pointsUnit: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  status: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { AppHeader } from '../../../components/AppHeader';
import { MuscleGroupCard } from '../../../components/MuscleGroupCard';
import { ProgressBar } from '../../../components/ProgressBar';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { StatCard } from '../../../components/StatCard';
import { images } from '../../../constants/images';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import { useProfile } from '../../../hooks/useProfile';
import { useRanking } from '../../../hooks/useRanking';
import type { MainTabScreenProps } from '../../../navigation/navigationTypes';
import { formatWeekRange, getGreeting, getWeekNumber } from '../../../utils/date';

export function DashboardScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { profile } = useProfile();
  const { rankings, weeklySummary, today } = useRanking();
  const { trainedGroups, totalGroups, pendingGroups, weeklyStreak, workoutsThisWeek } = weeklySummary;
  const isWeekComplete = pendingGroups === 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          subtitle={`${getGreeting()},`}
          title={profile.name}
          right={
            <Image
              source={images.avatar}
              style={styles.avatar}
              accessibilityLabel="Avatar do usuário"
              accessibilityIgnoresInvertColors
            />
          }
        />

        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekLabel}>SEMANA {getWeekNumber(today)}</Text>
            <Text style={styles.weekRange}>{formatWeekRange(today)}</Text>
          </View>
          <Text style={styles.weekValue} accessibilityLabel={`${trainedGroups} de ${totalGroups} grupos concluídos`}>
            {trainedGroups}
            <Text style={styles.weekTotal}> / {totalGroups}</Text>
          </Text>
          <Text style={styles.weekCaption}>
            {isWeekComplete ? 'Todos os grupos concluídos. Semana perfeita!' : 'grupos concluídos nesta semana'}
          </Text>
          <ProgressBar progress={trainedGroups / totalGroups} height={8} accessibilityLabel="Progresso semanal" />
        </View>

        <View style={styles.stats}>
          <StatCard label="Treinados" value={trainedGroups} icon="checkmark-done" accentColor={colors.success} />
          <StatCard label="Pendentes" value={pendingGroups} icon="hourglass-outline" accentColor={colors.warning} />
          <StatCard
            label={weeklyStreak === 1 ? 'Semana seguida' : 'Semanas seguidas'}
            value={weeklyStreak}
            icon="flame"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Grupos musculares
          </Text>
          <Text style={styles.sectionSubtitle}>
            {workoutsThisWeek} {workoutsThisWeek === 1 ? 'treino' : 'treinos'} esta semana
          </Text>
        </View>

        <View style={styles.grid}>
          {rankings.map((ranking) => (
            <View key={ranking.muscleGroup} style={styles.gridItem}>
              <MuscleGroupCard
                ranking={ranking}
                onPress={() => navigation.navigate('NewWorkout', { preselectedGroup: ranking.muscleGroup })}
              />
            </View>
          ))}
        </View>

        <AppButton
          label="Registrar treino"
          icon="add-circle-outline"
          onPress={() => navigation.navigate('NewWorkout')}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  avatar: {
    width: sizes.avatarSm,
    height: sizes.avatarSm,
    borderRadius: sizes.avatarSm / 2,
  },
  weekCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  weekRange: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  weekValue: {
    color: colors.text,
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
  },
  weekTotal: {
    color: colors.textSubtle,
    fontSize: fontSize.xl,
  },
  weekCaption: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    // Duas colunas: (100% - gap) / 2
    width: '48.5%',
    flexGrow: 1,
  },
});

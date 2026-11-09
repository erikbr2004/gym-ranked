import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../../components/AppButton';
import { AppHeader } from '../../../components/AppHeader';
import { MuscleGroupCard } from '../../../components/MuscleGroupCard';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { ProgressBar } from '../../../components/ProgressBar';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { StatCard } from '../../../components/StatCard';
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
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
              accessibilityHint="Mostra o perfil, a foto de perfil e as preferências"
              style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarButtonPressed]}
            >
              <ProfileAvatar size={sizes.avatarSm} />
            </Pressable>
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

        <Pressable
          onPress={() => navigation.navigate('ExerciseCatalog', { mode: 'browse' })}
          accessibilityRole="button"
          accessibilityLabel="Catálogo de exercícios"
          accessibilityHint="Consulta exercícios por grupo muscular na API wger"
          style={({ pressed }) => [styles.catalogCard, pressed && styles.catalogCardPressed]}
        >
          <View style={styles.catalogIcon}>
            <MaterialCommunityIcons name="book-open-variant" size={sizes.iconMd} color={colors.primary} />
          </View>
          <View style={styles.catalogTexts}>
            <Text style={styles.catalogTitle}>Catálogo de exercícios</Text>
            <Text style={styles.catalogSubtitle}>Explore exercícios por grupo muscular (API wger)</Text>
          </View>
          <Ionicons name="chevron-forward" size={sizes.iconMd} color={colors.textMuted} />
        </Pressable>
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
  avatarButton: {
    borderRadius: sizes.avatarSm / 2,
  },
  avatarButtonPressed: {
    opacity: 0.7,
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
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catalogCardPressed: {
    backgroundColor: colors.surfacePressed,
  },
  catalogIcon: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  catalogTexts: {
    flex: 1,
    gap: spacing.xxs,
  },
  catalogTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  catalogSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});

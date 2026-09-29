import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { EmptyState } from '../../../components/EmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { WorkoutCard } from '../../../components/WorkoutCard';
import { colors, fontSize, fontWeight, spacing } from '../../../constants/theme';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { MainTabScreenProps } from '../../../navigation/navigationTypes';
import type { DateKey } from '../../../types/common';
import { formatWeekRange, getWeekNumber, groupByWeek, isSameWeek } from '../../../utils/date';
import { useDeleteWorkout } from '../../workouts/hooks/useDeleteWorkout';
import type { Workout } from '../../workouts/types/workout';

type WeekSection = {
  title: string;
  subtitle: string;
  data: Workout[];
};

function buildSectionTitle(weekStart: DateKey, today: DateKey): string {
  return isSameWeek(weekStart, today) ? 'Semana atual' : `Semana ${getWeekNumber(weekStart)}`;
}

export function HistoryScreen({ navigation }: MainTabScreenProps<'History'>) {
  const { workouts, today } = useWorkouts();
  const confirmDelete = useDeleteWorkout();

  // `workouts` já vem ordenado do mais recente para o mais antigo.
  const sections = useMemo<WeekSection[]>(
    () =>
      groupByWeek(workouts, (workout) => workout.date).map((group) => ({
        title: buildSectionTitle(group.weekStart, today),
        subtitle: `${formatWeekRange(group.weekStart)} · ${group.items.length} ${
          group.items.length === 1 ? 'treino' : 'treinos'
        }`,
        data: group.items,
      })),
    [workouts, today],
  );

  return (
    <ScreenContainer>
      <SectionList
        sections={sections}
        keyExtractor={(workout) => workout.id}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <AppHeader title="Histórico" subtitle={`${workouts.length} treinos registrados`} />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => navigation.navigate('WorkoutDetails', { workoutId: item.id })}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="Nenhum treino registrado ainda."
            message="Registre seu primeiro treino para começar sua progressão."
            actionLabel="Registrar treino"
            onAction={() => navigation.navigate('NewWorkout')}
          />
        }
      />
    </ScreenContainer>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  separator: {
    height: spacing.sm,
  },
});

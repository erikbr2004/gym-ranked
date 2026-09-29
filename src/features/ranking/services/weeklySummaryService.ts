import type { DateKey } from '../../../types/common';
import {
  addWeeks,
  compareDateKeys,
  countWeeksInclusive,
  getWeekKey,
  getWeekStart,
} from '../../../utils/date';
import type { Workout } from '../../workouts/types/workout';
import type { MuscleRanking, WeeklySummary } from '../types/ranking';
import { getTrackingStartDate } from './rankingService';

/**
 * Semanas consecutivas com ao menos um treino. A semana atual só entra na
 * contagem se já tiver treino; caso contrário a sequência ainda não foi quebrada.
 */
export function calculateWeeklyStreak(workouts: readonly Workout[], today: DateKey): number {
  const activeWeeks = new Set(
    workouts
      .filter((workout) => compareDateKeys(workout.date, today) <= 0)
      .map((workout) => getWeekStart(workout.date)),
  );

  const currentWeekStart = getWeekStart(today);
  let weekStart = activeWeeks.has(currentWeekStart) ? currentWeekStart : addWeeks(currentWeekStart, -1);
  let streak = 0;
  while (activeWeeks.has(weekStart)) {
    streak += 1;
    weekStart = addWeeks(weekStart, -1);
  }
  return streak;
}

export function calculateWeeklySummary(
  rankings: readonly MuscleRanking[],
  workouts: readonly Workout[],
  profileStartDate: DateKey,
  today: DateKey,
): WeeklySummary {
  const weekStart = getWeekStart(today);
  const trainedGroups = rankings.filter((ranking) => ranking.trainedThisWeek).length;
  const workoutsThisWeek = workouts.filter(
    (workout) => getWeekStart(workout.date) === weekStart && compareDateKeys(workout.date, today) <= 0,
  ).length;

  return {
    weekStart,
    weekKey: getWeekKey(today),
    trainedGroups,
    pendingGroups: rankings.length - trainedGroups,
    totalGroups: rankings.length,
    workoutsThisWeek,
    weeklyStreak: calculateWeeklyStreak(workouts, today),
    weeksTracked: countWeeksInclusive(getTrackingStartDate(profileStartDate, workouts), today),
  };
}

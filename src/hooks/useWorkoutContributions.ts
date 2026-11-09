import { useMemo } from 'react';

import { useAppData } from '../contexts/AppDataContext';
import { getWorkoutContributions } from '../features/ranking/services/workoutContributionService';
import type { WorkoutGroupContribution } from '../features/ranking/types/ranking';
import type { Workout } from '../features/workouts/types/workout';

/** Rank e pontos de cada grupo do treino, lidos do ranking derivado (somente leitura). */
export function useWorkoutContributions(workout: Workout | undefined): WorkoutGroupContribution[] {
  const { workouts, rankings } = useAppData();
  return useMemo(
    () => (workout ? getWorkoutContributions(workout, workouts, rankings) : []),
    [workout, workouts, rankings],
  );
}

import { useCallback } from 'react';

import { useAppData } from '../contexts/AppDataContext';
import type { Workout } from '../features/workouts/types/workout';

export function useWorkouts() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout, today } = useAppData();

  const getWorkoutById = useCallback(
    (id: string): Workout | undefined => workouts.find((workout) => workout.id === id),
    [workouts],
  );

  return { workouts, today, addWorkout, updateWorkout, deleteWorkout, getWorkoutById };
}

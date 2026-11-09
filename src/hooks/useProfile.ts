import { useAppData } from '../contexts/AppDataContext';

export function useProfile() {
  const { profile, updateProfileName, replaceAllData, resetAllData, weeklySummary, workouts, photosByWorkoutId } =
    useAppData();

  return {
    profile,
    updateProfileName,
    replaceAllData,
    resetAllData,
    totalWorkouts: workouts.length,
    totalPhotos: Object.keys(photosByWorkoutId).length,
    weeksTracked: weeklySummary.weeksTracked,
  };
}

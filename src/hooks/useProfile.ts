import { useAppData } from '../contexts/AppDataContext';

export function useProfile() {
  const { profile, updateProfileName, replaceAllData, resetAllData, weeklySummary, workouts } = useAppData();

  return {
    profile,
    updateProfileName,
    replaceAllData,
    resetAllData,
    totalWorkouts: workouts.length,
    weeksTracked: weeklySummary.weeksTracked,
  };
}

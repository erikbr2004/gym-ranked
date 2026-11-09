import { getMuscleGroupLabel } from '../../../constants/muscleGroups';
import type { WorkoutGroupContribution } from '../../ranking/types/ranking';
import type { Workout } from '../../workouts/types/workout';
import type { WorkoutPhotoData } from '../types/photo';

/**
 * Dados que vão para a imagem, todos vindos do treino registrado e do ranking
 * calculado. Campos inexistentes (ex.: duração) simplesmente não aparecem.
 */
export function buildWorkoutPhotoData(
  workout: Workout,
  contributions: readonly WorkoutGroupContribution[],
): WorkoutPhotoData {
  return {
    title: workout.title,
    date: workout.date,
    ...(workout.durationMinutes !== undefined ? { durationMinutes: workout.durationMinutes } : {}),
    groups: contributions.map((contribution) => ({
      muscleGroup: contribution.muscleGroup,
      label: getMuscleGroupLabel(contribution.muscleGroup),
      rank: contribution.rank,
      pointsEarned: contribution.pointsEarned,
    })),
  };
}

export function hasPointsToShow(data: WorkoutPhotoData): boolean {
  return data.groups.some((group) => group.pointsEarned !== null);
}

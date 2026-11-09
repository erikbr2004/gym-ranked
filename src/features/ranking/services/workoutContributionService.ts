import { sortMuscleGroups, type MuscleGroup } from '../../../constants/muscleGroups';
import type { DateKey } from '../../../types/common';
import { getWeekStart } from '../../../utils/date';
import type { Workout } from '../../workouts/types/workout';
import type { MuscleRanking, WorkoutGroupContribution } from '../types/ranking';

/*
 * Explica o efeito de um treino no ranking sem alterar nada: as regras continuam
 * todas no rankingService, e aqui apenas lemos o resultado semanal calculado.
 *
 * A recompensa semanal de um grupo é atribuída ao PRIMEIRO treino registrado
 * daquele grupo na semana, ou seja, o treino que fez a semana contar. Os demais
 * treinos do mesmo grupo na semana não geram pontos (regra anti-farm), então
 * para eles nenhuma pontuação é exibida. Tirar foto não participa deste cálculo.
 */

function isRegisteredBefore(a: Workout, b: Workout): boolean {
  return a.createdAt < b.createdAt || (a.createdAt === b.createdAt && a.id < b.id);
}

/** Id do treino que recebeu a recompensa semanal do grupo, se a semana foi treinada. */
export function findCreditedWorkoutId(
  group: MuscleGroup,
  weekStart: DateKey,
  workouts: readonly Workout[],
): string | null {
  let first: Workout | null = null;
  for (const workout of workouts) {
    const isSameGroupAndWeek = workout.muscleGroups.includes(group) && getWeekStart(workout.date) === weekStart;
    if (isSameGroupAndWeek && (first === null || isRegisteredBefore(workout, first))) {
      first = workout;
    }
  }
  return first?.id ?? null;
}

export function getWorkoutContributions(
  workout: Workout,
  workouts: readonly Workout[],
  rankings: readonly MuscleRanking[],
): WorkoutGroupContribution[] {
  const weekStart = getWeekStart(workout.date);

  return sortMuscleGroups(workout.muscleGroups).flatMap((group) => {
    const ranking = rankings.find((item) => item.muscleGroup === group);
    if (!ranking) return [];

    const weekResult = ranking.weeklyResults.find((result) => result.weekStart === weekStart && result.trained);
    const isCredited = weekResult !== undefined && findCreditedWorkoutId(group, weekStart, workouts) === workout.id;

    return [
      {
        muscleGroup: group,
        rank: weekResult?.rankAfter ?? ranking.rank,
        points: weekResult?.pointsAfter ?? ranking.points,
        pointsEarned: isCredited ? weekResult.pointsAfter - weekResult.pointsBefore : null,
        streakBonus: isCredited ? weekResult.streakBonus : null,
      },
    ];
  });
}

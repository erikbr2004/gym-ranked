import type { MuscleGroup } from '../../../../constants/muscleGroups';
import type { Workout } from '../../../workouts/types/workout';
import { calculateRankings } from '../rankingService';
import { getWorkoutContributions } from '../workoutContributionService';

// Domingo, 08/11/2026 (semana 2026-W45: 02/11 a 08/11)
const TODAY = '2026-11-08';
const START = '2026-10-05';

function workout(id: string, date: string, groups: MuscleGroup[], createdAt: string): Workout {
  return { id, title: id, date, muscleGroups: groups, exercises: [], createdAt };
}

function contributionsOf(target: Workout, workouts: Workout[]) {
  const rankings = calculateRankings({ workouts, profileStartDate: START, today: TODAY });
  return getWorkoutContributions(target, workouts, rankings);
}

describe('getWorkoutContributions', () => {
  it('o primeiro treino registrado do grupo na semana recebe a recompensa semanal', () => {
    const push = workout('push', '2026-11-02', ['chest', 'triceps'], '2026-11-02T19:00:00Z');
    const [chest, triceps] = contributionsOf(push, [push]);

    expect(chest).toEqual({ muscleGroup: 'chest', rank: 'Iniciante', points: 25, pointsEarned: 25, streakBonus: 0 });
    expect(triceps.pointsEarned).toBe(25);
  });

  it('um segundo treino do mesmo grupo na semana não mostra pontos inventados', () => {
    const first = workout('a', '2026-11-02', ['chest'], '2026-11-02T19:00:00Z');
    const second = workout('b', '2026-11-05', ['chest', 'back'], '2026-11-05T19:00:00Z');
    const result = contributionsOf(second, [first, second]);

    expect(result.find((item) => item.muscleGroup === 'chest')?.pointsEarned).toBeNull();
    expect(result.find((item) => item.muscleGroup === 'back')?.pointsEarned).toBe(25);
  });

  it('registro retroativo em semana já contabilizada não gera pontos', () => {
    const wednesday = workout('qua', '2026-11-04', ['chest'], '2026-11-04T19:00:00Z');
    const mondayLate = workout('seg', '2026-11-02', ['chest'], '2026-11-07T10:00:00Z');

    expect(contributionsOf(mondayLate, [wednesday, mondayLate])[0].pointsEarned).toBeNull();
    expect(contributionsOf(wednesday, [wednesday, mondayLate])[0].pointsEarned).toBe(25);
  });

  it('usa o rank e os pontos do grupo ao fim da semana do treino, com o bônus de sequência', () => {
    const workouts: Workout[] = [];
    for (let week = 0; week < 4; week += 1) {
      const day = String(5 + week * 7).padStart(2, '0');
      workouts.push(workout(`w${week}`, `2026-10-${day}`, ['legs'], `2026-10-${day}T19:00:00Z`));
    }
    const result = contributionsOf(workouts[1], workouts);

    // 2ª semana seguida: +25 +5 de sequência → 55 pts (Bronze)
    expect(result[0]).toEqual({ muscleGroup: 'legs', rank: 'Bronze', points: 55, pointsEarned: 30, streakBonus: 5 });
  });

  it('sem crédito, não mostra bônus de sequência', () => {
    const first = workout('a', '2026-11-02', ['chest'], '2026-11-02T19:00:00Z');
    const second = workout('b', '2026-11-05', ['chest'], '2026-11-05T19:00:00Z');

    expect(contributionsOf(second, [first, second])[0].streakBonus).toBeNull();
  });

  it('não altera o ranking nem os treinos recebidos', () => {
    const push = workout('push', '2026-11-02', ['chest'], '2026-11-02T19:00:00Z');
    const workouts = [push];
    const rankings = calculateRankings({ workouts, profileStartDate: START, today: TODAY });
    const snapshot = JSON.stringify({ workouts, rankings });

    getWorkoutContributions(push, workouts, rankings);
    getWorkoutContributions(push, workouts, rankings);

    expect(JSON.stringify({ workouts, rankings })).toBe(snapshot);
  });
});

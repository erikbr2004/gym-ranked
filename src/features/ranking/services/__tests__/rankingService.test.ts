import type { MuscleGroup } from '../../../../constants/muscleGroups';
import type { Workout } from '../../../workouts/types/workout';
import {
  applyMissedWeek,
  applyTrainedWeek,
  calculateRankings,
  INITIAL_GROUP_STATE,
  sortRankings,
} from '../rankingService';
import { calculateWeeklyStreak } from '../weeklySummaryService';

// Segunda-feira, 28/09/2026 (semana 2026-W40)
const MONDAY = '2026-09-28';

let sequence = 0;
function workout(date: string, muscleGroups: MuscleGroup[]): Workout {
  sequence += 1;
  return { id: `w${sequence}`, title: 'Treino', date, muscleGroups, createdAt: `${date}T10:00:00.000Z` };
}

function rankingOf(group: MuscleGroup, workouts: Workout[], profileStartDate: string, today: string) {
  const ranking = calculateRankings({ workouts, profileStartDate, today }).find(
    (item) => item.muscleGroup === group,
  );
  if (!ranking) throw new Error('grupo não encontrado');
  return ranking;
}

describe('regras semanais', () => {
  it('perfil novo começa em Iniciante com 0 pontos', () => {
    const rankings = calculateRankings({ workouts: [], profileStartDate: MONDAY, today: MONDAY });
    expect(rankings).toHaveLength(7);
    rankings.forEach((ranking) => {
      expect(ranking.points).toBe(0);
      expect(ranking.rank).toBe('Iniciante');
      expect(ranking.consecutiveMissedWeeks).toBe(0);
    });
  });

  it('treino na semana atual conta o grupo e dá a recompensa', () => {
    const chest = rankingOf('chest', [workout(MONDAY, ['chest'])], MONDAY, MONDAY);
    expect(chest.trainedThisWeek).toBe(true);
    expect(chest.points).toBe(25);
  });

  it('vários treinos do mesmo grupo na mesma semana não duplicam a recompensa', () => {
    const workouts = [
      workout('2026-09-28', ['chest']),
      workout('2026-09-29', ['chest']),
      workout('2026-09-30', ['chest', 'triceps']),
      workout('2026-10-01', ['chest']),
      workout('2026-10-02', ['chest']),
    ];
    expect(rankingOf('chest', workouts, MONDAY, '2026-10-02').points).toBe(25);
    // W40 treinada (+25) e W41 completa sem treino (-15)
    expect(rankingOf('chest', workouts, MONDAY, '2026-10-12').points).toBe(10);
  });

  it('não penaliza a semana atual, que ainda não terminou', () => {
    const back = rankingOf('back', [], MONDAY, '2026-10-04'); // domingo da mesma semana
    expect(back.consecutiveMissedWeeks).toBe(0);
    expect(back.points).toBe(0);
  });

  it('penaliza somente semanas completas', () => {
    const workouts = [workout('2026-09-28', ['back'])];
    // W40 treinada (+25), W41 completa sem treino (-15); W42 é a semana atual
    const back = rankingOf('back', workouts, MONDAY, '2026-10-13');
    expect(back.points).toBe(10);
    expect(back.consecutiveMissedWeeks).toBe(1);
  });

  it('pontos nunca ficam negativos', () => {
    const abs = rankingOf('abs', [], '2026-01-05', MONDAY);
    expect(abs.points).toBe(0);
    expect(abs.consecutiveMissedWeeks).toBeGreaterThan(30);
  });

  it('treinar novamente zera as semanas sem treino', () => {
    const workouts = [workout('2026-09-28', ['legs']), workout('2026-10-19', ['legs'])];
    const legs = rankingOf('legs', workouts, MONDAY, '2026-10-19');
    expect(legs.consecutiveMissedWeeks).toBe(0);
    expect(legs.trainedThisWeek).toBe(true);
  });

  it('treinos com data futura não pontuam', () => {
    const chest = rankingOf('chest', [workout('2026-10-10', ['chest'])], MONDAY, MONDAY);
    expect(chest.points).toBe(0);
  });
});

describe('rebaixamento', () => {
  it('duas semanas seguidas sem treino rebaixam um rank mesmo com pontos sobrando', () => {
    // Ouro com 348 pts
    const first = applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 348 });
    expect(first).toMatchObject({ points: 333, consecutiveMissedWeeks: 1, demoted: false });

    const second = applyMissedWeek(first);
    expect(second.demoted).toBe(true);
    expect(second.consecutiveMissedWeeks).toBe(2);
    // Prata (200–299): cai para no máximo 200 + 50
    expect(second.points).toBe(250);
  });

  it('rebaixa em relação ao rank do início do período, sem cair dois ranks', () => {
    // Ouro 300 → 1ª semana: 285 (já é Prata pelos pontos) → 2ª semana: Prata, não Bronze
    const first = applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 300 });
    expect(first.points).toBe(285);
    const second = applyMissedWeek(first);
    expect(second.demoted).toBe(true);
    expect(second.points).toBe(250);
  });

  it('rebaixa novamente a cada duas semanas seguidas (4ª, 6ª...)', () => {
    let state = { ...INITIAL_GROUP_STATE, points: 348 };
    const demotions: boolean[] = [];
    for (let week = 0; week < 4; week += 1) {
      const outcome = applyMissedWeek(state);
      demotions.push(outcome.demoted);
      state = outcome;
    }
    expect(demotions).toEqual([false, true, false, true]);
    expect(state.points).toBe(150); // Ouro → Prata → Bronze
  });

  it('Iniciante não tem rank inferior', () => {
    const outcome = applyMissedWeek(applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 55 }));
    expect(outcome).toMatchObject({ points: 25, consecutiveMissedWeeks: 2, demoted: false });
  });

  it('cenário completo derivado do histórico', () => {
    // 12 semanas treinando pernas (300 pts = Ouro), depois 2 semanas sem treino
    const start = '2026-06-01';
    const workouts: Workout[] = [];
    for (let week = 0; week < 12; week += 1) {
      const date = new Date(Date.UTC(2026, 5, 1 + week * 7)).toISOString().slice(0, 10);
      workouts.push(workout(date, ['legs']));
    }
    const beforeGap = rankingOf('legs', workouts, start, '2026-08-24');
    expect(beforeGap.points).toBe(300);
    expect(beforeGap.rank).toBe('Ouro');

    const afterGap = rankingOf('legs', workouts, start, '2026-09-07');
    expect(afterGap.consecutiveMissedWeeks).toBe(2);
    expect(afterGap.rank).toBe('Prata');
    expect(afterGap.points).toBe(250);
    expect(afterGap.weeklyResults.at(-1)?.demoted).toBe(true);
  });

  it('é determinístico: recalcular com a mesma entrada gera o mesmo resultado', () => {
    const workouts = [workout('2026-08-03', ['chest', 'back']), workout('2026-09-01', ['legs'])];
    const input = { workouts, profileStartDate: '2026-08-01', today: MONDAY };
    expect(calculateRankings(input)).toEqual(calculateRankings(input));
  });
});

describe('ordenação e resumo', () => {
  it('treino zera o contador de semanas perdidas', () => {
    const outcome = applyTrainedWeek({ ...INITIAL_GROUP_STATE, consecutiveMissedWeeks: 3 });
    expect(outcome.consecutiveMissedWeeks).toBe(0);
  });

  it('ordena por rank e depois por pontos', () => {
    const workouts = [
      workout('2026-09-14', ['back']),
      workout('2026-09-21', ['back', 'chest']),
      workout('2026-09-28', ['back']),
    ];
    const sorted = sortRankings(calculateRankings({ workouts, profileStartDate: '2026-09-14', today: MONDAY }));
    expect(sorted[0].muscleGroup).toBe('back');
    expect(sorted[1].muscleGroup).toBe('chest');
  });

  it('calcula a sequência semanal', () => {
    const workouts = [
      workout('2026-09-14', ['back']),
      workout('2026-09-21', ['back']),
      workout('2026-09-07', ['back']),
      workout('2026-08-24', ['back']),
    ];
    // semana atual sem treino não quebra a sequência
    expect(calculateWeeklyStreak(workouts, MONDAY)).toBe(3);
    expect(calculateWeeklyStreak([...workouts, workout(MONDAY, ['chest'])], MONDAY)).toBe(4);
  });
});

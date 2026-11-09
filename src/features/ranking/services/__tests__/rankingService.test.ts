import type { MuscleGroup } from '../../../../constants/muscleGroups';
import { RANK_TIERS } from '../../../../constants/rankingConfig';
import type { Workout } from '../../../workouts/types/workout';
import {
  applyMissedWeek,
  applyTrainedWeek,
  calculateRankings,
  getDemotionLandingPoints,
  getMissedWeekPenalty,
  getStreakBonus,
  INITIAL_GROUP_STATE,
  sortRankings,
} from '../rankingService';
import { calculateWeeklyStreak } from '../weeklySummaryService';

// Segunda-feira, 28/09/2026 (semana 2026-W40)
const MONDAY = '2026-09-28';

let sequence = 0;
function workout(date: string, muscleGroups: MuscleGroup[]): Workout {
  sequence += 1;
  return { id: `w${sequence}`, title: 'Treino', date, muscleGroups, exercises: [], createdAt: `${date}T10:00:00.000Z` };
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
    // W40 treinada (+25) e W41 completa sem treino (-10 no Iniciante)
    expect(rankingOf('chest', workouts, MONDAY, '2026-10-12').points).toBe(15);
  });

  it('não penaliza a semana atual, que ainda não terminou', () => {
    const back = rankingOf('back', [], MONDAY, '2026-10-04'); // domingo da mesma semana
    expect(back.consecutiveMissedWeeks).toBe(0);
    expect(back.points).toBe(0);
  });

  it('penaliza somente semanas completas', () => {
    const workouts = [workout('2026-09-28', ['back'])];
    // W40 treinada (+25), W41 completa sem treino (-10); W42 é a semana atual
    const back = rankingOf('back', workouts, MONDAY, '2026-10-13');
    expect(back.points).toBe(15);
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

describe('bônus de sequência', () => {
  it('rende +0 na 1ª semana, +5 na 2ª seguida e no máximo +10 a partir da 3ª', () => {
    expect([0, 1, 2, 3, 10].map(getStreakBonus)).toEqual([0, 5, 10, 10, 10]);
  });

  it('semanas seguidas somam 25, 30, 35, 35...', () => {
    const workouts = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'].map((date) => workout(date, ['legs']));
    const legs = rankingOf('legs', workouts, '2026-09-07', MONDAY);

    expect(legs.weeklyResults.map((week) => week.pointsAfter - week.pointsBefore)).toEqual([25, 30, 35, 35]);
    expect(legs.weeklyResults.map((week) => week.streakBonus)).toEqual([0, 5, 10, 10]);
    expect(legs.points).toBe(125);
    expect(legs.consecutiveTrainedWeeks).toBe(4);
  });

  it('uma semana sem treino zera a sequência', () => {
    // W37 +25, W38 +30 (55, Bronze), W39 sem treino (-15 no Bronze), W40 recomeça em +25
    const workouts = ['2026-09-07', '2026-09-14', '2026-09-28'].map((date) => workout(date, ['back']));
    const back = rankingOf('back', workouts, '2026-09-07', MONDAY);

    expect(back.points).toBe(65);
    expect(back.weeklyResults.at(-1)?.streakBonus).toBe(0);
    expect(back.consecutiveTrainedWeeks).toBe(1);
  });

  it('a semana atual ainda sem treino não quebra a sequência', () => {
    const workouts = ['2026-09-14', '2026-09-21'].map((date) => workout(date, ['chest']));
    const chest = rankingOf('chest', workouts, '2026-09-14', MONDAY);

    expect(chest.trainedThisWeek).toBe(false);
    expect(chest.consecutiveTrainedWeeks).toBe(2);
    expect(chest.consecutiveMissedWeeks).toBe(0);
  });
});

describe('dificuldade crescente', () => {
  it('as faixas ficam mais largas a cada rank', () => {
    const gaps = RANK_TIERS.slice(1).map((tier, index) => tier.minPoints - RANK_TIERS[index].minPoints);
    gaps.slice(1).forEach((gap, index) => expect(gap).toBeGreaterThanOrEqual(gaps[index]));
  });

  it('faltar custa mais quanto maior o rank', () => {
    const penalties = RANK_TIERS.map((tier) => tier.missedWeekPenalty);
    penalties.slice(1).forEach((penalty, index) => expect(penalty).toBeGreaterThan(penalties[index]));
    expect(getMissedWeekPenalty(0)).toBe(10); // Iniciante
    expect(getMissedWeekPenalty(300)).toBe(25); // Ouro
    expect(getMissedWeekPenalty(1200)).toBe(50); // Elite
  });

  it('aplica a penalidade do rank em que o grupo está no início da semana', () => {
    expect(applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 1200 }).points).toBe(1150);
    expect(applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 300 }).points).toBe(275);
  });
});

describe('rebaixamento', () => {
  it('duas semanas seguidas sem treino rebaixam um rank mesmo com pontos sobrando', () => {
    // Ouro (275–399) com 390 pts
    const first = applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 390 });
    expect(first).toMatchObject({ points: 365, consecutiveMissedWeeks: 1, demoted: false });

    const second = applyMissedWeek(first);
    expect(second.demoted).toBe(true);
    expect(second.consecutiveMissedWeeks).toBe(2);
    // Prata (150–274): cai para no máximo o meio da faixa, 150 + 62
    expect(second.points).toBe(212);
  });

  it('cai para o meio da faixa do rank inferior', () => {
    expect(getDemotionLandingPoints(0)).toBe(25); // Iniciante 0–49
    expect(getDemotionLandingPoints(2)).toBe(212); // Prata 150–274
    expect(getDemotionLandingPoints(6)).toBe(950); // Mestre 800–1099
  });

  it('rebaixa em relação ao rank do início do período, sem cair dois ranks', () => {
    // Ouro 280 → 1ª semana: 255 (já é Prata pelos pontos) → 2ª semana: Prata, não Bronze
    const first = applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 280 });
    expect(first.points).toBe(255);
    const second = applyMissedWeek(first);
    expect(second.demoted).toBe(true);
    expect(second.points).toBe(212);
  });

  it('rebaixa novamente a cada duas semanas seguidas (4ª, 6ª...)', () => {
    let state = { ...INITIAL_GROUP_STATE, points: 390 };
    const demotions: boolean[] = [];
    for (let week = 0; week < 4; week += 1) {
      const outcome = applyMissedWeek(state);
      demotions.push(outcome.demoted);
      state = outcome;
    }
    expect(demotions).toEqual([false, true, false, true]);
    expect(state.points).toBe(100); // Ouro → Prata → Bronze (meio da faixa 50–149)
  });

  it('quem cai do Bronze vai para o Iniciante, não volta ao Bronze', () => {
    // 60 (Bronze) → -15 → 45 → -10 → 35, limitado ao meio do Iniciante (25)
    const outcome = applyMissedWeek(applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 60 }));
    expect(outcome).toMatchObject({ points: 25, demoted: true });
  });

  it('Iniciante não tem rank inferior', () => {
    const outcome = applyMissedWeek(applyMissedWeek({ ...INITIAL_GROUP_STATE, points: 45 }));
    expect(outcome).toMatchObject({ points: 25, consecutiveMissedWeeks: 2, demoted: false });
  });

  it('cenário completo derivado do histórico', () => {
    // 12 semanas seguidas treinando pernas: 25 + 30 + 10 × 35 = 405 pts (Platina)
    const start = '2026-06-01';
    const workouts: Workout[] = [];
    for (let week = 0; week < 12; week += 1) {
      const date = new Date(Date.UTC(2026, 5, 1 + week * 7)).toISOString().slice(0, 10);
      workouts.push(workout(date, ['legs']));
    }
    const beforeGap = rankingOf('legs', workouts, start, '2026-08-24');
    expect(beforeGap.points).toBe(405);
    expect(beforeGap.rank).toBe('Platina');

    // 2 semanas sem treino: -30 (Platina) → 375, -25 (Ouro) → 350, rebaixado ao meio do Ouro
    const afterGap = rankingOf('legs', workouts, start, '2026-09-07');
    expect(afterGap.consecutiveMissedWeeks).toBe(2);
    expect(afterGap.consecutiveTrainedWeeks).toBe(0);
    expect(afterGap.rank).toBe('Ouro');
    expect(afterGap.points).toBe(337);
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

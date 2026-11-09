import { MUSCLE_GROUP_IDS, type MuscleGroup } from '../../../constants/muscleGroups';
import { RANK_TIERS, RANKING_RULES } from '../../../constants/rankingConfig';
import type { DateKey } from '../../../types/common';
import {
  compareDateKeys,
  getCompletedWeekStarts,
  getWeekKey,
  getWeekStart,
  minDateKey,
} from '../../../utils/date';
import type { Workout } from '../../workouts/types/workout';
import type { MuscleRanking, WeeklyResult } from '../types/ranking';
import { getRankForPoints, getRankIndex, getRankIndexForPoints } from '../utils/rankUtils';

/*
 * Serviço central do ranking.
 *
 * O ranking NUNCA é salvo: ele é sempre derivado do histórico de treinos
 * (workouts → rankingService → MuscleRanking[] → interface). Assim, criar,
 * editar ou excluir um treino recalcula tudo de forma consistente, e abrir o
 * app depois de várias semanas produz o mesmo resultado que abri-lo toda semana.
 *
 * Regras (valores em constants/rankingConfig.ts). Quanto maior o rank, mais
 * difícil: as faixas são mais largas e faltar custa mais.
 *  1. Para cada semana COMPLETA desde o início do acompanhamento:
 *     - grupo treinado ao menos uma vez → +25 pts, mais o bônus de sequência
 *       (+5 na 2ª semana seguida, +10 a partir da 3ª), e zera semanas sem treino;
 *       vários treinos do mesmo grupo na semana contam uma única vez (anti-farm);
 *     - grupo não treinado → perde a penalidade do rank atual (de -10 no
 *       Iniciante a -50 no Elite; mínimo 0), +1 semana sem treino e a
 *       sequência volta a zero.
 *  2. A cada 2 semanas completas consecutivas sem treino o grupo é rebaixado
 *     um rank em relação ao rank que tinha no INÍCIO desse período de 2 semanas,
 *     mesmo que a pontuação ainda estivesse dentro dele (ex.: Ouro → Prata).
 *     Usar o rank do início do período evita cair dois ranks quando a penalidade
 *     da 1ª semana já cruzou a fronteira. A pontuação passa a ser no máximo o
 *     meio da faixa do novo rank, mantendo rank = f(pontos).
 *  3. A semana atual (ainda não terminada) nunca é penalizada. Se o grupo já
 *     foi treinado nela, a recompensa aparece imediatamente — ela é garantida,
 *     pois a semana terminará como "treinada" de qualquer forma.
 */

export type GroupState = {
  points: number;
  consecutiveMissedWeeks: number;
  /** Semanas seguidas em que o grupo foi treinado (base do bônus de sequência). */
  consecutiveTrainedWeeks: number;
  /** Rank no início do período atual de semanas perdidas (referência do rebaixamento). */
  blockStartRankIndex: number;
};

export const INITIAL_GROUP_STATE: GroupState = {
  points: RANKING_RULES.MIN_POINTS,
  consecutiveMissedWeeks: 0,
  consecutiveTrainedWeeks: 0,
  blockStartRankIndex: 0,
};

type WeekOutcome = GroupState & {
  demoted: boolean;
  /** Parte da recompensa que veio da sequência (0 em semanas perdidas). */
  streakBonus: number;
};

/** Bônus da semana treinada, dado o número de semanas seguidas já treinadas antes dela. */
export function getStreakBonus(previousTrainedWeeks: number): number {
  const { STREAK_BONUS_PER_WEEK, STREAK_BONUS_MAX } = RANKING_RULES;
  return Math.min(previousTrainedWeeks * STREAK_BONUS_PER_WEEK, STREAK_BONUS_MAX);
}

/** Pontos perdidos por uma semana sem treino: depende do rank em que o grupo está. */
export function getMissedWeekPenalty(points: number): number {
  return RANK_TIERS[getRankIndexForPoints(points)].missedWeekPenalty;
}

/** Pontuação máxima de quem foi rebaixado para o rank `rankIndex`: o meio da faixa dele. */
export function getDemotionLandingPoints(rankIndex: number): number {
  const tier = RANK_TIERS[rankIndex];
  const next = RANK_TIERS[rankIndex + 1];
  // Sempre existe um rank acima de quem foi rebaixado; a guarda só protege a configuração.
  if (!next) return tier.minPoints;
  return tier.minPoints + Math.floor((next.minPoints - tier.minPoints) * RANKING_RULES.DEMOTION_LANDING_RATIO);
}

export type RankingInput = {
  workouts: readonly Workout[];
  profileStartDate: DateKey;
  today: DateKey;
};

/**
 * Primeiro dia considerado pelo ranking: o início do perfil ou o treino mais
 * antigo, o que vier antes (permite registrar treinos retroativos).
 */
export function getTrackingStartDate(profileStartDate: DateKey, workouts: readonly Workout[]): DateKey {
  return workouts.reduce((earliest, workout) => minDateKey(earliest, workout.date), profileStartDate);
}

export function applyTrainedWeek(state: GroupState): WeekOutcome {
  const streakBonus = getStreakBonus(state.consecutiveTrainedWeeks);
  const points = state.points + RANKING_RULES.WEEKLY_TRAINED_REWARD + streakBonus;
  return {
    points,
    consecutiveMissedWeeks: 0,
    consecutiveTrainedWeeks: state.consecutiveTrainedWeeks + 1,
    blockStartRankIndex: getRankIndexForPoints(points),
    demoted: false,
    streakBonus,
  };
}

export function applyMissedWeek(state: GroupState): WeekOutcome {
  const { MISSED_WEEKS_FOR_DEMOTION, MIN_POINTS } = RANKING_RULES;

  const startsNewBlock = state.consecutiveMissedWeeks % MISSED_WEEKS_FOR_DEMOTION === 0;
  const blockStartRankIndex = startsNewBlock
    ? getRankIndexForPoints(state.points)
    : state.blockStartRankIndex;
  const consecutiveMissedWeeks = state.consecutiveMissedWeeks + 1;
  const penalizedPoints = Math.max(MIN_POINTS, state.points - getMissedWeekPenalty(state.points));

  const completesBlock = consecutiveMissedWeeks % MISSED_WEEKS_FOR_DEMOTION === 0;
  const hasLowerRank = blockStartRankIndex > 0;
  const base = { consecutiveMissedWeeks, consecutiveTrainedWeeks: 0, blockStartRankIndex, streakBonus: 0 };

  if (!completesBlock || !hasLowerRank) {
    return { ...base, points: penalizedPoints, demoted: false };
  }

  return {
    ...base,
    points: Math.min(penalizedPoints, getDemotionLandingPoints(blockStartRankIndex - 1)),
    demoted: true,
  };
}

/** Semanas (segunda-feira) em que cada grupo foi treinado — no máximo uma entrada por semana. */
function indexTrainedWeeks(workouts: readonly Workout[], today: DateKey): Map<MuscleGroup, Set<DateKey>> {
  const index = new Map<MuscleGroup, Set<DateKey>>(
    MUSCLE_GROUP_IDS.map((group) => [group, new Set<DateKey>()]),
  );
  for (const workout of workouts) {
    // Treinos com data futura (ex.: relógio do aparelho alterado) não pontuam.
    if (compareDateKeys(workout.date, today) > 0) continue;
    const weekStart = getWeekStart(workout.date);
    for (const group of workout.muscleGroups) {
      index.get(group)?.add(weekStart);
    }
  }
  return index;
}

function findLastTrainedDate(group: MuscleGroup, workouts: readonly Workout[], today: DateKey): DateKey | null {
  let last: DateKey | null = null;
  for (const workout of workouts) {
    const isPastOrToday = compareDateKeys(workout.date, today) <= 0;
    const isMoreRecent = last === null || compareDateKeys(workout.date, last) > 0;
    if (isPastOrToday && isMoreRecent && workout.muscleGroups.includes(group)) {
      last = workout.date;
    }
  }
  return last;
}

function buildWeeklyResult(
  weekStart: DateKey,
  trained: boolean,
  isComplete: boolean,
  before: GroupState,
  outcome: WeekOutcome,
): WeeklyResult {
  return {
    weekStart,
    weekKey: getWeekKey(weekStart),
    trained,
    isComplete,
    pointsBefore: before.points,
    pointsAfter: outcome.points,
    rankAfter: getRankForPoints(outcome.points),
    demoted: outcome.demoted,
    streakBonus: outcome.streakBonus,
  };
}

function calculateGroupRanking(
  group: MuscleGroup,
  trainedWeeks: ReadonlySet<DateKey>,
  completedWeeks: readonly DateKey[],
  currentWeekStart: DateKey,
  lastTrainedDate: DateKey | null,
): MuscleRanking {
  let state: GroupState = INITIAL_GROUP_STATE;
  const weeklyResults: WeeklyResult[] = [];

  for (const weekStart of completedWeeks) {
    const trained = trainedWeeks.has(weekStart);
    const outcome = trained ? applyTrainedWeek(state) : applyMissedWeek(state);
    weeklyResults.push(buildWeeklyResult(weekStart, trained, true, state, outcome));
    state = outcome;
  }

  const trainedThisWeek = trainedWeeks.has(currentWeekStart);
  if (trainedThisWeek) {
    const outcome = applyTrainedWeek(state);
    weeklyResults.push(buildWeeklyResult(currentWeekStart, true, false, state, outcome));
    state = outcome;
  }

  return {
    muscleGroup: group,
    points: state.points,
    rank: getRankForPoints(state.points),
    consecutiveMissedWeeks: state.consecutiveMissedWeeks,
    consecutiveTrainedWeeks: state.consecutiveTrainedWeeks,
    trainedThisWeek,
    lastTrainedDate,
    weeklyResults,
  };
}

/** Calcula o ranking de todos os grupos musculares, na ordem canônica dos grupos. */
export function calculateRankings({ workouts, profileStartDate, today }: RankingInput): MuscleRanking[] {
  const trackingStart = getTrackingStartDate(profileStartDate, workouts);
  const completedWeeks = getCompletedWeekStarts(trackingStart, today);
  const currentWeekStart = getWeekStart(today);
  const trainedWeeksByGroup = indexTrainedWeeks(workouts, today);

  return MUSCLE_GROUP_IDS.map((group) =>
    calculateGroupRanking(
      group,
      trainedWeeksByGroup.get(group) ?? new Set(),
      completedWeeks,
      currentWeekStart,
      findLastTrainedDate(group, workouts, today),
    ),
  );
}

/** Ordena por rank (maior primeiro), depois pontos, depois ordem canônica do grupo. */
export function sortRankings(rankings: readonly MuscleRanking[]): MuscleRanking[] {
  return [...rankings].sort(
    (a, b) =>
      getRankIndex(b.rank) - getRankIndex(a.rank) ||
      b.points - a.points ||
      MUSCLE_GROUP_IDS.indexOf(a.muscleGroup) - MUSCLE_GROUP_IDS.indexOf(b.muscleGroup),
  );
}

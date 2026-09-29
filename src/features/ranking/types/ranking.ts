import type { MuscleGroup } from '../../../constants/muscleGroups';
import type { RankName } from '../../../constants/rankingConfig';
import type { DateKey, WeekKey } from '../../../types/common';

/** Resultado do processamento de uma semana para um grupo muscular. */
export type WeeklyResult = {
  weekStart: DateKey;
  weekKey: WeekKey;
  trained: boolean;
  /** `false` apenas para a semana atual, que ainda pode mudar. */
  isComplete: boolean;
  pointsBefore: number;
  pointsAfter: number;
  rankAfter: RankName;
  demoted: boolean;
};

export type MuscleRanking = {
  muscleGroup: MuscleGroup;
  points: number;
  rank: RankName;
  consecutiveMissedWeeks: number;
  trainedThisWeek: boolean;
  lastTrainedDate: DateKey | null;
  /** Histórico semana a semana, da mais antiga para a mais recente. */
  weeklyResults: WeeklyResult[];
};

export type RankProgress = {
  current: RankName;
  next: RankName | null;
  /** Fração de 0 a 1 percorrida dentro do rank atual. */
  progress: number;
  pointsToNext: number | null;
};

export type WeeklySummary = {
  weekStart: DateKey;
  weekKey: WeekKey;
  trainedGroups: number;
  pendingGroups: number;
  totalGroups: number;
  workoutsThisWeek: number;
  /** Semanas consecutivas com pelo menos um treino registrado. */
  weeklyStreak: number;
  weeksTracked: number;
};

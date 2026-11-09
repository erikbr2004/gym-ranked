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
  /** Parte dos pontos da semana que veio do bônus de sequência (0 se a semana foi perdida). */
  streakBonus: number;
};

export type MuscleRanking = {
  muscleGroup: MuscleGroup;
  points: number;
  rank: RankName;
  consecutiveMissedWeeks: number;
  /** Semanas seguidas treinando o grupo (inclui a atual, se já foi treinada). */
  consecutiveTrainedWeeks: number;
  trainedThisWeek: boolean;
  lastTrainedDate: DateKey | null;
  /** Histórico semana a semana, da mais antiga para a mais recente. */
  weeklyResults: WeeklyResult[];
};

/** Efeito de um treino em um grupo muscular, derivado do ranking (somente leitura). */
export type WorkoutGroupContribution = {
  muscleGroup: MuscleGroup;
  /** Rank do grupo ao fim da semana do treino (na semana atual, o rank de agora). */
  rank: RankName;
  points: number;
  /**
   * Recompensa semanal creditada a este treino. `null` quando a semana já tinha
   * sido contabilizada por outro treino do mesmo grupo (nenhum ponto novo).
   */
  pointsEarned: number | null;
  /** Quanto de `pointsEarned` veio do bônus de sequência (`null` quando nada foi creditado). */
  streakBonus: number | null;
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

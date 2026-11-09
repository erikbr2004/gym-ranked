/**
 * Configuração central da mecânica competitiva.
 * Qualquer ajuste de balanceamento (faixas de rank, pontos semanais,
 * penalidades, bônus de sequência, regra de rebaixamento) deve ser feito somente aqui.
 *
 * Quanto maior o rank, mais difícil: as faixas ficam mais largas (subir exige
 * mais semanas) e faltar custa mais pontos (manter exige constância).
 */

export const RANK_TIERS = [
  { name: 'Iniciante', minPoints: 0, missedWeekPenalty: 10 },
  { name: 'Bronze', minPoints: 50, missedWeekPenalty: 15 },
  { name: 'Prata', minPoints: 150, missedWeekPenalty: 20 },
  { name: 'Ouro', minPoints: 275, missedWeekPenalty: 25 },
  { name: 'Platina', minPoints: 400, missedWeekPenalty: 30 },
  { name: 'Diamante', minPoints: 550, missedWeekPenalty: 35 },
  { name: 'Mestre', minPoints: 800, missedWeekPenalty: 40 },
  { name: 'Elite', minPoints: 1100, missedWeekPenalty: 50 },
] as const;

export type RankTier = (typeof RANK_TIERS)[number];
export type RankName = RankTier['name'];

export const RANKING_RULES = {
  /** Pontos ganhos por grupo muscular treinado ao menos uma vez na semana. */
  WEEKLY_TRAINED_REWARD: 25,
  /**
   * Bônus de sequência: +5 por semana seguida já treinada antes desta, até o limite.
   * 1ª semana: +0 · 2ª semana seguida: +5 · 3ª em diante: +10.
   */
  STREAK_BONUS_PER_WEEK: 5,
  STREAK_BONUS_MAX: 10,
  /**
   * A cada N semanas completas consecutivas sem treino o grupo cai um rank
   * (com N = 2: rebaixa na 2ª, 4ª, 6ª semana seguida sem treino...).
   * A penalidade de cada semana perdida depende do rank (`missedWeekPenalty`).
   */
  MISSED_WEEKS_FOR_DEMOTION: 2,
  /**
   * Após um rebaixamento, a pontuação é limitada à fração indicada da faixa do
   * novo rank (0,5 = meio da faixa), garantindo que o grupo fique de fato nele.
   */
  DEMOTION_LANDING_RATIO: 0.5,
  MIN_POINTS: 0,
} as const;

/**
 * Configuração central da mecânica competitiva.
 * Qualquer ajuste de balanceamento (faixas de rank, pontos semanais,
 * regra de rebaixamento) deve ser feito somente aqui.
 */

export const RANK_TIERS = [
  { name: 'Iniciante', minPoints: 0 },
  { name: 'Bronze', minPoints: 100 },
  { name: 'Prata', minPoints: 200 },
  { name: 'Ouro', minPoints: 300 },
  { name: 'Platina', minPoints: 400 },
  { name: 'Diamante', minPoints: 500 },
  { name: 'Mestre', minPoints: 600 },
  { name: 'Elite', minPoints: 700 },
] as const;

export type RankTier = (typeof RANK_TIERS)[number];
export type RankName = RankTier['name'];

export const RANKING_RULES = {
  /** Pontos ganhos por grupo muscular treinado ao menos uma vez na semana. */
  WEEKLY_TRAINED_REWARD: 25,
  /** Pontos perdidos por grupo muscular não treinado em uma semana completa. */
  WEEKLY_MISSED_PENALTY: 15,
  /**
   * A cada N semanas completas consecutivas sem treino o grupo cai um rank
   * (com N = 2: rebaixa na 2ª, 4ª, 6ª semana seguida sem treino...).
   */
  MISSED_WEEKS_FOR_DEMOTION: 2,
  /**
   * Após um rebaixamento, a pontuação é limitada a `mínimo do novo rank + offset`,
   * garantindo que o usuário fique de fato dentro do rank inferior.
   */
  DEMOTION_LANDING_OFFSET: 50,
  MIN_POINTS: 0,
} as const;

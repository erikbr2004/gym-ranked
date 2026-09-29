import { RANK_TIERS, type RankName } from '../../../constants/rankingConfig';
import type { RankProgress } from '../types/ranking';

export function getRankIndexForPoints(points: number): number {
  let index = 0;
  RANK_TIERS.forEach((tier, tierIndex) => {
    if (points >= tier.minPoints) index = tierIndex;
  });
  return index;
}

export function getRankForPoints(points: number): RankName {
  return RANK_TIERS[getRankIndexForPoints(points)].name;
}

export function getRankIndex(rank: RankName): number {
  return RANK_TIERS.findIndex((tier) => tier.name === rank);
}

/** Faixa de pontos de um rank, para exibição (`null` = sem limite superior). */
export function getRankRange(rank: RankName): { min: number; max: number | null } {
  const index = getRankIndex(rank);
  const next = RANK_TIERS[index + 1];
  return { min: RANK_TIERS[index].minPoints, max: next ? next.minPoints - 1 : null };
}

export function getRankProgress(points: number): RankProgress {
  const index = getRankIndexForPoints(points);
  const current = RANK_TIERS[index];
  const next = RANK_TIERS[index + 1];

  if (!next) {
    return { current: current.name, next: null, progress: 1, pointsToNext: null };
  }

  const span = next.minPoints - current.minPoints;
  return {
    current: current.name,
    next: next.name,
    progress: Math.min(Math.max((points - current.minPoints) / span, 0), 1),
    pointsToNext: next.minPoints - points,
  };
}

import { useMemo } from 'react';

import { useAppData } from '../contexts/AppDataContext';
import { sortRankings } from '../features/ranking/services/rankingService';

export function useRanking() {
  const { rankings, weeklySummary, today } = useAppData();
  const sortedRankings = useMemo(() => sortRankings(rankings), [rankings]);

  return { rankings, sortedRankings, weeklySummary, today };
}

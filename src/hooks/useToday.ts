import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { DateKey } from '../types/common';
import { getTodayKey } from '../utils/date';

const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Data atual que se atualiza quando o app volta ao primeiro plano ou vira o dia.
 * Garante que o ranking seja recalculado ao reabrir o app dias depois.
 */
export function useToday(): DateKey {
  const [today, setToday] = useState<DateKey>(() => getTodayKey());

  useEffect(() => {
    const refresh = () => setToday(getTodayKey());

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const interval = setInterval(refresh, CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return today;
}

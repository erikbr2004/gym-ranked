import type { DateKey } from '../../../types/common';

export type Profile = {
  name: string;
  /** Início do acompanhamento: primeira semana considerada pelo ranking. */
  startDate: DateKey;
  createdAt: string;
};

export const DEFAULT_PROFILE_NAME = 'Atleta';
export const PROFILE_NAME_MAX_LENGTH = 30;

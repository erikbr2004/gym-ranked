import type { DateKey } from '../../../types/common';

export type Profile = {
  name: string;
  /** Início do acompanhamento: primeira semana considerada pelo ranking. */
  startDate: DateKey;
  createdAt: string;
  /** Caminho RELATIVO da foto de perfil na pasta de documentos do app; ausente = avatar padrão. */
  avatarPath?: string;
};

export const DEFAULT_PROFILE_NAME = 'Atleta';
export const PROFILE_NAME_MAX_LENGTH = 30;

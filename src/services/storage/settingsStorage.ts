import { PHOTO_ACCENT_IDS, type PhotoAccentId } from '../../constants/theme';
import { isRecord, readJson, writeJson } from './jsonStorage';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Preferências do usuário (pequenas, chave-valor) no AsyncStorage.
 * Os treinos ficam no SQLite; aqui ficam só configurações.
 */
export type AppSettings = {
  /** Exibir o rank de cada grupo muscular na foto do treino. */
  photoShowRanks: boolean;
  /** Exibir os pontos conquistados (quando houver) na foto do treino. */
  photoShowPoints: boolean;
  /** Cor de destaque usada na composição da foto. */
  photoAccent: PhotoAccentId;
};

export const DEFAULT_SETTINGS: AppSettings = {
  photoShowRanks: true,
  photoShowPoints: true,
  photoAccent: 'lime',
};

function isPhotoAccent(value: unknown): value is PhotoAccentId {
  return typeof value === 'string' && (PHOTO_ACCENT_IDS as readonly string[]).includes(value);
}

/** Aproveita cada campo válido e usa o padrão para o resto (dados antigos ou corrompidos). */
export function parseSettings(value: unknown): AppSettings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  const { photoShowRanks, photoShowPoints, photoAccent } = value;

  return {
    photoShowRanks: typeof photoShowRanks === 'boolean' ? photoShowRanks : DEFAULT_SETTINGS.photoShowRanks,
    photoShowPoints: typeof photoShowPoints === 'boolean' ? photoShowPoints : DEFAULT_SETTINGS.photoShowPoints,
    photoAccent: isPhotoAccent(photoAccent) ? photoAccent : DEFAULT_SETTINGS.photoAccent,
  };
}

export const settingsStorage = {
  async get(): Promise<AppSettings> {
    return parseSettings(await readJson(STORAGE_KEYS.SETTINGS));
  },

  async save(settings: AppSettings): Promise<void> {
    await writeJson(STORAGE_KEYS.SETTINGS, settings);
  },
};

import { DEFAULT_PROFILE_NAME, type Profile } from '../../features/profile/types/profile';
import { getTodayKey, isValidDateKey } from '../../utils/date';
import { isNonEmptyString } from '../../utils/guards';
import { isRecord, readJson, writeJson } from './jsonStorage';
import { STORAGE_KEYS } from './storageKeys';

export type ProfileRepository = {
  /** Retorna o perfil salvo ou cria (e persiste) o perfil padrão na primeira execução. */
  getOrCreate(): Promise<Profile>;
  save(profile: Profile): Promise<void>;
};

export function createDefaultProfile(now: Date = new Date()): Profile {
  return {
    name: DEFAULT_PROFILE_NAME,
    startDate: getTodayKey(now),
    createdAt: now.toISOString(),
  };
}

export function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) return null;
  const { name, startDate, createdAt, avatarPath } = value;
  const isValid =
    typeof name === 'string' &&
    name.trim().length > 0 &&
    isValidDateKey(startDate) &&
    typeof createdAt === 'string';
  if (!isValid) return null;

  const profile: Profile = { name, startDate, createdAt };
  // Foto de perfil é opcional: um valor inválido é ignorado sem descartar o perfil.
  if (isNonEmptyString(avatarPath)) profile.avatarPath = avatarPath;
  return profile;
}

export const profileStorage: ProfileRepository = {
  async getOrCreate() {
    const stored = parseProfile(await readJson(STORAGE_KEYS.PROFILE));
    if (stored) return stored;

    const profile = createDefaultProfile();
    await writeJson(STORAGE_KEYS.PROFILE, profile);
    return profile;
  },

  async save(profile) {
    await writeJson(STORAGE_KEYS.PROFILE, profile);
  },
};

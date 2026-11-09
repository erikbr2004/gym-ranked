import { removeKeys } from './jsonStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Remove do AsyncStorage o perfil, as preferências e eventuais dados antigos. */
export async function clearAppStorage(): Promise<void> {
  await removeKeys(Object.values(STORAGE_KEYS));
}

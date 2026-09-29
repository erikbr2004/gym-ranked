import { removeKeys } from './jsonStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Remove todos os dados do app salvos no aparelho. */
export async function clearAppStorage(): Promise<void> {
  await removeKeys(Object.values(STORAGE_KEYS));
}

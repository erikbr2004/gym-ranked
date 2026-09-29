import AsyncStorage from '@react-native-async-storage/async-storage';

/** Erro de persistência com mensagem pronta para ser exibida ao usuário. */
export class StorageError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Lê e desserializa um valor JSON.
 * Retorna `null` quando a chave não existe (primeira execução) ou quando o
 * conteúdo está corrompido — nesse caso o app segue com dados padrão em vez de travar.
 */
export async function readJson(key: string): Promise<unknown> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch (error) {
    throw new StorageError('Não foi possível ler os dados salvos no aparelho.', error);
  }

  if (raw === null) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    console.warn(`[storage] JSON inválido em "${key}". Os dados serão reiniciados.`, error);
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new StorageError('Não foi possível salvar os dados no aparelho.', error);
  }
}

export async function removeKeys(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    throw new StorageError('Não foi possível apagar os dados do aparelho.', error);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

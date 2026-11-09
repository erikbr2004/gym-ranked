import type { SqlDatabase } from '../types';

/** Pares chave-valor internos do banco (ex.: controle de migrações de dados). */
export const metaRepository = {
  async get(db: SqlDatabase, key: string): Promise<string | null> {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [key]);
    return row?.value ?? null;
  },

  async set(db: SqlDatabase, key: string, value: string): Promise<void> {
    await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [key, value]);
  },
};

import { Platform } from 'react-native';
import { openDatabaseAsync } from 'expo-sqlite';

import { migrateSchema } from './migrations/schemaMigrations';
import { DatabaseError, type SqlDatabase } from './types';

export const DATABASE_NAME = 'gymrank.db';

let databasePromise: Promise<SqlDatabase> | null = null;

/**
 * No navegador o expo-sqlite grava o banco no OPFS, que só existe em contexto
 * seguro (HTTPS ou localhost). Aberto por um IP da rede em HTTP, o navegador
 * bloqueia esse armazenamento, então avisamos o motivo em vez de um erro genérico.
 */
function assertDatabaseAvailable(): void {
  if (Platform.OS === 'web' && 'isSecureContext' in globalThis && globalThis.isSecureContext === false) {
    throw new DatabaseError(
      'No navegador, o banco de dados só funciona em endereço seguro. Abra o app pelo localhost neste computador (ex.: http://localhost:8081) ou use o Expo Go no celular.',
    );
  }
}

async function openAndPrepareDatabase(): Promise<SqlDatabase> {
  assertDatabaseAvailable();
  const db = await openDatabaseAsync(DATABASE_NAME);
  // PRAGMAs valem por conexão e não têm efeito dentro de transações.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrateSchema(db);
  return db;
}

/**
 * Conexão única do app, aberta e migrada na primeira chamada.
 * Em caso de falha a próxima chamada tenta abrir o banco novamente.
 */
export function getDatabase(): Promise<SqlDatabase> {
  if (!databasePromise) {
    databasePromise = openAndPrepareDatabase().catch((error: unknown) => {
      databasePromise = null;
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Não foi possível abrir o banco de dados do aparelho.', error);
    });
  }
  return databasePromise;
}

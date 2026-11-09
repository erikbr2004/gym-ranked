import { migrateSchema } from '../services/database/migrations/schemaMigrations';
import type { SqlDatabase, SqlValue } from '../services/database/types';

/*
 * Banco SQLite real, em memória, para os testes automatizados.
 * Usa o módulo nativo `node:sqlite` (Node 22.5+) com a mesma interface assíncrona
 * do expo-sqlite, então os testes executam exatamente o SQL do aplicativo.
 * Este arquivo não é importado pelo app.
 */

type StatementSync = {
  run: (...params: SqlValue[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  get: (...params: SqlValue[]) => unknown;
  all: (...params: SqlValue[]) => unknown[];
};

type DatabaseSync = {
  exec: (source: string) => void;
  prepare: (source: string) => StatementSync;
  close: () => void;
};

type NodeSqliteModule = {
  DatabaseSync: new (location: string) => DatabaseSync;
};

type NodeProcess = {
  getBuiltinModule: (id: string) => unknown;
};

export type TestDatabase = SqlDatabase & {
  close: () => void;
};

function loadNodeSqlite(): NodeSqliteModule {
  // `getBuiltinModule` contorna o resolvedor de módulos do Jest, que não conhece `node:sqlite`.
  const nodeProcess = (globalThis as unknown as { process: NodeProcess }).process;
  return nodeProcess.getBuiltinModule('node:sqlite') as NodeSqliteModule;
}

export function createTestDatabase(): TestDatabase {
  const { DatabaseSync } = loadNodeSqlite();
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  return {
    async execAsync(source) {
      db.exec(source);
    },
    async runAsync(source, params) {
      const result = db.prepare(source).run(...params);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getFirstAsync<T>(source: string, params: SqlValue[]) {
      return (db.prepare(source).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(source: string, params: SqlValue[]) {
      return db.prepare(source).all(...params) as T[];
    },
    async withTransactionAsync(task) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close() {
      db.close();
    },
  };
}

/** Banco em memória com o esquema mais recente aplicado. */
export async function createMigratedTestDatabase(): Promise<TestDatabase> {
  const db = createTestDatabase();
  await migrateSchema(db);
  return db;
}

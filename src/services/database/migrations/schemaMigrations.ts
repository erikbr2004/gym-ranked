import type { SqlDatabase } from '../types';

/*
 * Migrações de esquema versionadas pelo `PRAGMA user_version`.
 * Uma migração publicada nunca deve ser editada: mudanças futuras entram como
 * uma nova versão no final da lista.
 */

type SchemaMigration = {
  version: number;
  description: string;
  statements: string;
};

export const SCHEMA_MIGRATIONS: readonly SchemaMigration[] = [
  {
    version: 1,
    description: 'Treinos, grupos musculares, exercícios, fotos e metadados do app',
    statements: `
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts (date);

      CREATE TABLE IF NOT EXISTS workout_muscle_groups (
        workout_id TEXT NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
        muscle_group TEXT NOT NULL,
        PRIMARY KEY (workout_id, muscle_group)
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        workout_id TEXT NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        muscle_group TEXT,
        position INTEGER NOT NULL,
        PRIMARY KEY (workout_id, exercise_id)
      );

      CREATE TABLE IF NOT EXISTS workout_photos (
        id TEXT PRIMARY KEY NOT NULL,
        workout_id TEXT NOT NULL UNIQUE REFERENCES workouts (id) ON DELETE CASCADE,
        original_image_path TEXT NOT NULL,
        generated_image_path TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
];

export const LATEST_SCHEMA_VERSION = SCHEMA_MIGRATIONS[SCHEMA_MIGRATIONS.length - 1].version;

export async function getSchemaVersion(db: SqlDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  return row?.user_version ?? 0;
}

/** Aplica, em ordem e cada uma em sua transação, as migrações ainda não executadas. */
export async function migrateSchema(db: SqlDatabase): Promise<number> {
  let currentVersion = await getSchemaVersion(db);

  for (const migration of SCHEMA_MIGRATIONS) {
    if (migration.version <= currentVersion) continue;

    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.statements);
      // PRAGMA não aceita parâmetros; a versão vem de uma constante do próprio código.
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    currentVersion = migration.version;
  }

  return currentVersion;
}

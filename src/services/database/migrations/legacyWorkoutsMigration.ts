import type { Workout } from '../../../features/workouts/types/workout';
import { metaRepository } from '../repositories/metaRepository';
import { insertWorkoutRecord, workoutRepository } from '../repositories/workoutRepository';
import type { SqlDatabase } from '../types';

/*
 * Migração única dos treinos da primeira etapa (AsyncStorage) para o SQLite.
 *
 * Garantias:
 *  - os treinos entram com os mesmos ids, datas, grupos e horários de registro;
 *  - `INSERT OR IGNORE` impede duplicação se a migração for interrompida e repetida;
 *  - a marca de "concluída" é gravada na mesma transação dos treinos, ou seja,
 *    só existe se todos os registros foram persistidos;
 *  - os dados antigos só são apagados do AsyncStorage depois do commit e de
 *    conferir que todos os ids estão no banco.
 */

export const LEGACY_WORKOUTS_MIGRATION_KEY = 'migration.asyncstorage_workouts.completed_at';

/** Origem dos treinos antigos. `read` retorna `null` quando não há dados antigos. */
export type LegacyWorkoutSource = {
  read: () => Promise<Workout[] | null>;
  remove: () => Promise<void>;
};

export type LegacyMigrationResult = {
  status: 'migrated' | 'nothing-to-migrate' | 'already-done';
  /** Treinos gravados nesta execução. */
  inserted: number;
  /** Treinos que já existiam no banco com o mesmo id (não foram duplicados). */
  alreadyPresent: number;
};

async function finishCleanup(db: SqlDatabase, source: LegacyWorkoutSource, workouts: Workout[]): Promise<void> {
  const persisted = await workoutRepository.countExisting(
    db,
    workouts.map((workout) => workout.id),
  );
  if (persisted === workouts.length) {
    await source.remove();
  } else {
    console.warn('[migration] Treinos antigos mantidos no AsyncStorage: nem todos foram confirmados no SQLite.');
  }
}

export async function migrateLegacyWorkouts(
  db: SqlDatabase,
  source: LegacyWorkoutSource,
): Promise<LegacyMigrationResult> {
  const completedAt = await metaRepository.get(db, LEGACY_WORKOUTS_MIGRATION_KEY);

  if (completedAt) {
    // O app pode ter sido fechado entre o commit e a limpeza do AsyncStorage.
    const leftovers = await source.read();
    if (leftovers) await finishCleanup(db, source, leftovers);
    return { status: 'already-done', inserted: 0, alreadyPresent: 0 };
  }

  const legacyWorkouts = await source.read();
  let inserted = 0;

  await db.withTransactionAsync(async () => {
    for (const workout of legacyWorkouts ?? []) {
      if (await insertWorkoutRecord(db, workout, { ignoreExisting: true })) {
        inserted += 1;
      }
    }
    await metaRepository.set(db, LEGACY_WORKOUTS_MIGRATION_KEY, new Date().toISOString());
  });

  if (!legacyWorkouts) {
    return { status: 'nothing-to-migrate', inserted: 0, alreadyPresent: 0 };
  }

  await finishCleanup(db, source, legacyWorkouts);
  return { status: 'migrated', inserted, alreadyPresent: legacyWorkouts.length - inserted };
}

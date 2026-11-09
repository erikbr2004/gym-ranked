import { calculateRankings } from '../../../features/ranking/services/rankingService';
import type { Workout } from '../../../features/workouts/types/workout';
import { parseLegacyWorkout } from '../../storage/legacyWorkoutStorage';
import { createMigratedTestDatabase, type TestDatabase } from '../../../test-utils/testDatabase';
import {
  LEGACY_WORKOUTS_MIGRATION_KEY,
  migrateLegacyWorkouts,
  type LegacyWorkoutSource,
} from '../migrations/legacyWorkoutsMigration';
import { metaRepository } from '../repositories/metaRepository';
import { workoutRepository } from '../repositories/workoutRepository';

/** Treinos exatamente como a primeira etapa os salvava no AsyncStorage (sem `exercises`). */
const LEGACY_JSON = [
  {
    title: 'Push',
    date: '2026-10-26',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    durationMinutes: 65,
    notes: 'treino pesado',
    id: 'mulmiv1t-54wq1hkc',
    createdAt: '2026-10-26T19:11:41.489Z',
  },
  {
    title: 'Pull',
    date: '2026-11-02',
    muscleGroups: ['back', 'biceps'],
    id: 'mulmj5sv-aaaa1111',
    createdAt: '2026-11-02T18:00:00.000Z',
  },
  { title: 'corrompido', date: '31/02/2026', muscleGroups: [], id: 'x', createdAt: 'x' },
];

function legacyWorkouts(): Workout[] {
  return LEGACY_JSON.map(parseLegacyWorkout).filter((workout): workout is Workout => workout !== null);
}

function createSource(initial: Workout[] | null): LegacyWorkoutSource & { stored: Workout[] | null } {
  const source = {
    stored: initial,
    read: async () => source.stored,
    remove: async () => {
      source.stored = null;
    },
  };
  return source;
}

let db: TestDatabase;

beforeEach(async () => {
  db = await createMigratedTestDatabase();
});

afterEach(() => {
  db.close();
});

describe('parseLegacyWorkout', () => {
  it('adapta o modelo antigo e descarta registros inválidos', () => {
    const workouts = legacyWorkouts();
    expect(workouts).toHaveLength(2);
    expect(workouts[0]).toEqual({ ...LEGACY_JSON[0], exercises: [] });
    expect(workouts[1]).not.toHaveProperty('durationMinutes');
  });
});

describe('migrateLegacyWorkouts', () => {
  it('migra preservando ids, datas e grupos e só então apaga os dados antigos', async () => {
    const source = createSource(legacyWorkouts());

    const result = await migrateLegacyWorkouts(db, source);

    expect(result).toEqual({ status: 'migrated', inserted: 2, alreadyPresent: 0 });
    const stored = await workoutRepository.findAll(db);
    expect(stored.map((workout) => workout.id).sort()).toEqual(['mulmiv1t-54wq1hkc', 'mulmj5sv-aaaa1111']);
    expect(await workoutRepository.findById(db, 'mulmiv1t-54wq1hkc')).toEqual(legacyWorkouts()[0]);
    expect(source.stored).toBeNull();
    expect(await metaRepository.get(db, LEGACY_WORKOUTS_MIGRATION_KEY)).not.toBeNull();
  });

  it('não executa de novo depois de concluída', async () => {
    await migrateLegacyWorkouts(db, createSource(legacyWorkouts()));
    const second = await migrateLegacyWorkouts(db, createSource(null));

    expect(second.status).toBe('already-done');
    expect(await workoutRepository.count(db)).toBe(2);
  });

  it('não duplica treinos se for repetida após uma interrupção', async () => {
    // Simula uma execução anterior que gravou um treino mas não chegou a marcar a migração.
    await workoutRepository.insert(db, legacyWorkouts()[0]);

    const result = await migrateLegacyWorkouts(db, createSource(legacyWorkouts()));

    expect(result).toEqual({ status: 'migrated', inserted: 1, alreadyPresent: 1 });
    expect(await workoutRepository.count(db)).toBe(2);
  });

  it('em caso de falha não marca como concluída e mantém os dados antigos', async () => {
    const broken = { ...legacyWorkouts()[1], muscleGroups: ['back', 'back'] } as Workout;
    const source = createSource([legacyWorkouts()[0], broken]);

    await expect(migrateLegacyWorkouts(db, source)).rejects.toThrow();

    expect(await workoutRepository.count(db)).toBe(0);
    expect(await metaRepository.get(db, LEGACY_WORKOUTS_MIGRATION_KEY)).toBeNull();
    expect(source.stored).toHaveLength(2);
  });

  it('conclui a limpeza pendente se o app fechou logo após o commit', async () => {
    const source = createSource(legacyWorkouts());
    await migrateLegacyWorkouts(db, source);
    source.stored = legacyWorkouts(); // dados antigos "sobreviveram" ao fechamento

    const result = await migrateLegacyWorkouts(db, source);

    expect(result.status).toBe('already-done');
    expect(source.stored).toBeNull();
    expect(await workoutRepository.count(db)).toBe(2);
  });

  it('primeira execução sem dados antigos apenas marca a migração', async () => {
    const result = await migrateLegacyWorkouts(db, createSource(null));
    expect(result.status).toBe('nothing-to-migrate');
    expect(await metaRepository.get(db, LEGACY_WORKOUTS_MIGRATION_KEY)).not.toBeNull();
  });

  it('o ranking calculado com os treinos migrados é idêntico ao anterior', async () => {
    const before = calculateRankings({ workouts: legacyWorkouts(), profileStartDate: '2026-10-26', today: '2026-11-08' });

    await migrateLegacyWorkouts(db, createSource(legacyWorkouts()));
    const migrated = await workoutRepository.findAll(db);
    const after = calculateRankings({ workouts: migrated, profileStartDate: '2026-10-26', today: '2026-11-08' });

    expect(after).toEqual(before);
  });
});

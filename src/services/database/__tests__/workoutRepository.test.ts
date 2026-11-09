import type { Workout } from '../../../features/workouts/types/workout';
import { createMigratedTestDatabase, createTestDatabase, type TestDatabase } from '../../../test-utils/testDatabase';
import { getSchemaVersion, LATEST_SCHEMA_VERSION, migrateSchema } from '../migrations/schemaMigrations';
import { photoRepository } from '../repositories/photoRepository';
import { workoutRepository } from '../repositories/workoutRepository';

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'w1',
    title: 'Push',
    date: '2026-11-02',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    exercises: [],
    durationMinutes: 65,
    notes: 'treino pesado',
    createdAt: '2026-11-02T19:00:00.000Z',
    ...overrides,
  };
}

let db: TestDatabase;

beforeEach(async () => {
  db = await createMigratedTestDatabase();
});

afterEach(() => {
  db.close();
});

describe('migrações de esquema', () => {
  it('cria as tabelas e registra a versão no PRAGMA user_version', async () => {
    const fresh = createTestDatabase();
    expect(await getSchemaVersion(fresh)).toBe(0);

    await migrateSchema(fresh);
    expect(await getSchemaVersion(fresh)).toBe(LATEST_SCHEMA_VERSION);

    const tables = await fresh.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      [],
    );
    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining(['app_meta', 'workout_exercises', 'workout_muscle_groups', 'workout_photos', 'workouts']),
    );
    fresh.close();
  });

  it('é idempotente: rodar de novo não recria nem altera nada', async () => {
    await workoutRepository.insert(db, makeWorkout());
    await migrateSchema(db);
    expect(await workoutRepository.count(db)).toBe(1);
  });
});

describe('workoutRepository', () => {
  it('insere e consulta o treino com grupos e exercícios', async () => {
    const workout = makeWorkout({
      exercises: [
        { exerciseId: 73, name: 'Supino reto', muscleGroup: 'chest' },
        { exerciseId: 194, name: 'Fundos para tríceps', muscleGroup: 'triceps' },
      ],
    });
    await workoutRepository.insert(db, workout);

    expect(await workoutRepository.findById(db, 'w1')).toEqual(workout);
    expect(await workoutRepository.findAll(db)).toEqual([workout]);
  });

  it('omite duração e observações quando não foram informadas', async () => {
    const workout = makeWorkout({ durationMinutes: undefined, notes: undefined });
    await workoutRepository.insert(db, workout);

    const stored = await workoutRepository.findById(db, 'w1');
    expect(stored).not.toHaveProperty('durationMinutes');
    expect(stored).not.toHaveProperty('notes');
  });

  it('usa parâmetros: textos com aspas são gravados sem quebrar o SQL', async () => {
    const title = "Treino d'Ana\"; DROP TABLE workouts; --";
    await workoutRepository.insert(db, makeWorkout({ title }));

    expect((await workoutRepository.findById(db, 'w1'))?.title).toBe(title);
    expect(await workoutRepository.count(db)).toBe(1);
  });

  it('lista do mais recente para o mais antigo', async () => {
    await workoutRepository.insert(db, makeWorkout({ id: 'a', date: '2026-10-01' }));
    await workoutRepository.insert(db, makeWorkout({ id: 'b', date: '2026-11-05' }));
    await workoutRepository.insert(db, makeWorkout({ id: 'c', date: '2026-11-05', createdAt: '2026-11-05T21:00:00.000Z' }));

    expect((await workoutRepository.findAll(db)).map((workout) => workout.id)).toEqual(['c', 'b', 'a']);
  });

  it('atualiza dados, grupos e exercícios em uma transação', async () => {
    await workoutRepository.insert(db, makeWorkout());
    const updated = makeWorkout({
      title: 'Pull',
      muscleGroups: ['back', 'biceps'],
      exercises: [{ exerciseId: 1, name: 'Remada', muscleGroup: 'back' }],
      durationMinutes: undefined,
    });
    await workoutRepository.update(db, updated);

    expect(await workoutRepository.findById(db, 'w1')).toEqual(updated);
  });

  it('falha ao atualizar um treino inexistente sem gravar nada', async () => {
    await expect(workoutRepository.update(db, makeWorkout({ id: 'nao-existe' }))).rejects.toThrow('Treino não encontrado.');
    expect(await workoutRepository.count(db)).toBe(0);
  });

  it('desfaz a inserção inteira se uma relação falhar (transação)', async () => {
    const duplicatedExercise = makeWorkout({
      exercises: [
        { exerciseId: 73, name: 'Supino reto', muscleGroup: 'chest' },
        { exerciseId: 73, name: 'Supino reto', muscleGroup: 'chest' },
      ],
    });
    await expect(workoutRepository.insert(db, duplicatedExercise)).rejects.toThrow();
    expect(await workoutRepository.count(db)).toBe(0);
  });

  it('exclui o treino e, em cascata, grupos, exercícios e foto', async () => {
    await workoutRepository.insert(db, makeWorkout({ exercises: [{ exerciseId: 73, name: 'Supino', muscleGroup: 'chest' }] }));
    await photoRepository.upsert(db, {
      id: 'p1',
      workoutId: 'w1',
      originalImagePath: 'workout-photos/w1-original.jpg',
      generatedImagePath: 'workout-photos/w1-gymrank.jpg',
      createdAt: '2026-11-02T20:00:00.000Z',
    });

    expect(await workoutRepository.remove(db, 'w1')).toBe(true);

    for (const table of ['workout_muscle_groups', 'workout_exercises', 'workout_photos']) {
      const row = await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM ${table}`, []);
      expect(row?.total).toBe(0);
    }
  });

  it('substitui todo o histórico (dados de demonstração)', async () => {
    await workoutRepository.insert(db, makeWorkout({ id: 'antigo' }));
    await workoutRepository.replaceAll(db, [makeWorkout({ id: 'x' }), makeWorkout({ id: 'y' })]);

    expect((await workoutRepository.findAll(db)).map((workout) => workout.id).sort()).toEqual(['x', 'y']);
  });

  it('conta quantos ids já existem', async () => {
    await workoutRepository.insert(db, makeWorkout({ id: 'a' }));
    await workoutRepository.insert(db, makeWorkout({ id: 'b' }));
    expect(await workoutRepository.countExisting(db, ['a', 'b', 'c'])).toBe(2);
  });
});

describe('photoRepository', () => {
  const photo = {
    id: 'p1',
    workoutId: 'w1',
    originalImagePath: 'workout-photos/w1-a-original.jpg',
    generatedImagePath: 'workout-photos/w1-a-gymrank.jpg',
    createdAt: '2026-11-02T20:00:00.000Z',
  };

  it('vincula a foto a um treino existente', async () => {
    await workoutRepository.insert(db, makeWorkout());
    await photoRepository.upsert(db, photo);

    expect(await photoRepository.findByWorkoutId(db, 'w1')).toEqual(photo);
    expect(await photoRepository.findAllPaths(db)).toEqual([photo.originalImagePath, photo.generatedImagePath]);
  });

  it('a chave estrangeira impede foto de treino inexistente', async () => {
    await expect(photoRepository.upsert(db, { ...photo, workoutId: 'nao-existe' })).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('substituir a foto mantém um único registro por treino', async () => {
    await workoutRepository.insert(db, makeWorkout());
    await photoRepository.upsert(db, photo);
    await photoRepository.upsert(db, {
      ...photo,
      id: 'p2',
      generatedImagePath: 'workout-photos/w1-b-gymrank.jpg',
    });

    const photos = await photoRepository.findAll(db);
    expect(photos).toHaveLength(1);
    expect(photos[0].generatedImagePath).toBe('workout-photos/w1-b-gymrank.jpg');
  });

  it('remove a foto sem excluir o treino', async () => {
    await workoutRepository.insert(db, makeWorkout());
    await photoRepository.upsert(db, photo);

    expect(await photoRepository.removeByWorkoutId(db, 'w1')).toBe(true);
    expect(await photoRepository.findByWorkoutId(db, 'w1')).toBeNull();
    expect(await workoutRepository.count(db)).toBe(1);
  });
});

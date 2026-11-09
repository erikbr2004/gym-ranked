import { isMuscleGroup, sortMuscleGroups, type MuscleGroup } from '../../../constants/muscleGroups';
import type { Workout, WorkoutExercise } from '../../../features/workouts/types/workout';
import { isValidDateKey } from '../../../utils/date';
import type { SqlDatabase } from '../types';

type WorkoutRow = {
  id: string;
  title: string;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
};

type MuscleGroupRow = {
  workout_id: string;
  muscle_group: string;
};

type ExerciseRow = {
  workout_id: string;
  exercise_id: number;
  name: string;
  muscle_group: string | null;
  position: number;
};

const WORKOUT_COLUMNS = 'id, title, date, duration_minutes, notes, created_at';
/** Mais recente primeiro; empate resolvido pelo momento do registro. */
const ORDER_BY_RECENT = 'ORDER BY date DESC, created_at DESC';

function groupBy<T>(rows: T[], getKey: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }
  return groups;
}

function toExercise(row: ExerciseRow): WorkoutExercise {
  return {
    exerciseId: row.exercise_id,
    name: row.name,
    muscleGroup: isMuscleGroup(row.muscle_group) ? row.muscle_group : null,
  };
}

/**
 * Monta o treino a partir das três tabelas. Linhas inconsistentes (data inválida
 * ou nenhum grupo muscular válido) são ignoradas para não quebrar o ranking.
 */
function toWorkout(row: WorkoutRow, groupRows: MuscleGroupRow[], exerciseRows: ExerciseRow[]): Workout | null {
  const muscleGroups = groupRows
    .map((groupRow) => groupRow.muscle_group)
    .filter((group): group is MuscleGroup => isMuscleGroup(group));

  if (!isValidDateKey(row.date) || muscleGroups.length === 0) {
    console.warn(`[database] Treino "${row.id}" inconsistente foi ignorado.`);
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    date: row.date,
    muscleGroups: sortMuscleGroups(muscleGroups),
    exercises: [...exerciseRows].sort((a, b) => a.position - b.position).map(toExercise),
    createdAt: row.created_at,
    ...(row.duration_minutes !== null ? { durationMinutes: row.duration_minutes } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

async function insertChildRows(db: SqlDatabase, workout: Workout): Promise<void> {
  for (const group of workout.muscleGroups) {
    await db.runAsync('INSERT INTO workout_muscle_groups (workout_id, muscle_group) VALUES (?, ?)', [
      workout.id,
      group,
    ]);
  }
  for (const [position, exercise] of workout.exercises.entries()) {
    await db.runAsync(
      'INSERT INTO workout_exercises (workout_id, exercise_id, name, muscle_group, position) VALUES (?, ?, ?, ?, ?)',
      [workout.id, exercise.exerciseId, exercise.name, exercise.muscleGroup, position],
    );
  }
}

/**
 * Insere o treino e suas relações. Deve ser chamado dentro de uma transação.
 * Com `ignoreExisting`, um treino com o mesmo id é mantido como está (usado na
 * migração para nunca duplicar registros). Retorna se o treino foi inserido.
 */
export async function insertWorkoutRecord(
  db: SqlDatabase,
  workout: Workout,
  options: { ignoreExisting?: boolean } = {},
): Promise<boolean> {
  const verb = options.ignoreExisting ? 'INSERT OR IGNORE' : 'INSERT';
  const result = await db.runAsync(
    `${verb} INTO workouts (${WORKOUT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      workout.id,
      workout.title,
      workout.date,
      workout.durationMinutes ?? null,
      workout.notes ?? null,
      workout.createdAt,
    ],
  );
  if (result.changes === 0) return false;

  await insertChildRows(db, workout);
  return true;
}

async function loadWorkouts(db: SqlDatabase, rows: WorkoutRow[]): Promise<Workout[]> {
  if (rows.length === 0) return [];

  const [groupRows, exerciseRows] = await Promise.all([
    db.getAllAsync<MuscleGroupRow>('SELECT workout_id, muscle_group FROM workout_muscle_groups', []),
    db.getAllAsync<ExerciseRow>(
      'SELECT workout_id, exercise_id, name, muscle_group, position FROM workout_exercises',
      [],
    ),
  ]);
  const groupsByWorkout = groupBy(groupRows, (row) => row.workout_id);
  const exercisesByWorkout = groupBy(exerciseRows, (row) => row.workout_id);

  return rows
    .map((row) => toWorkout(row, groupsByWorkout.get(row.id) ?? [], exercisesByWorkout.get(row.id) ?? []))
    .filter((workout): workout is Workout => workout !== null);
}

/** Acesso aos treinos no SQLite. Toda consulta usa parâmetros (`?`), nunca concatenação de valores. */
export const workoutRepository = {
  async findAll(db: SqlDatabase): Promise<Workout[]> {
    const rows = await db.getAllAsync<WorkoutRow>(`SELECT ${WORKOUT_COLUMNS} FROM workouts ${ORDER_BY_RECENT}`, []);
    return loadWorkouts(db, rows);
  },

  async findById(db: SqlDatabase, id: string): Promise<Workout | null> {
    const row = await db.getFirstAsync<WorkoutRow>(`SELECT ${WORKOUT_COLUMNS} FROM workouts WHERE id = ?`, [id]);
    if (!row) return null;

    const [groupRows, exerciseRows] = await Promise.all([
      db.getAllAsync<MuscleGroupRow>(
        'SELECT workout_id, muscle_group FROM workout_muscle_groups WHERE workout_id = ?',
        [id],
      ),
      db.getAllAsync<ExerciseRow>(
        'SELECT workout_id, exercise_id, name, muscle_group, position FROM workout_exercises WHERE workout_id = ?',
        [id],
      ),
    ]);
    return toWorkout(row, groupRows, exerciseRows);
  },

  async count(db: SqlDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM workouts', []);
    return row?.total ?? 0;
  },

  async insert(db: SqlDatabase, workout: Workout): Promise<void> {
    await db.withTransactionAsync(async () => {
      await insertWorkoutRecord(db, workout);
    });
  },

  /** Atualiza os dados e substitui grupos e exercícios em uma única transação. */
  async update(db: SqlDatabase, workout: Workout): Promise<void> {
    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        'UPDATE workouts SET title = ?, date = ?, duration_minutes = ?, notes = ? WHERE id = ?',
        [workout.title, workout.date, workout.durationMinutes ?? null, workout.notes ?? null, workout.id],
      );
      if (result.changes === 0) throw new Error('Treino não encontrado.');

      await db.runAsync('DELETE FROM workout_muscle_groups WHERE workout_id = ?', [workout.id]);
      await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', [workout.id]);
      await insertChildRows(db, workout);
    });
  },

  /** Remove o treino; grupos, exercícios e foto vinculados saem por `ON DELETE CASCADE`. */
  async remove(db: SqlDatabase, id: string): Promise<boolean> {
    const result = await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
    return result.changes > 0;
  },

  /** Substitui todo o histórico (usado pelos dados de demonstração). */
  async replaceAll(db: SqlDatabase, workouts: Workout[]): Promise<void> {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM workouts', []);
      for (const workout of workouts) {
        await insertWorkoutRecord(db, workout);
      }
    });
  },

  async removeAll(db: SqlDatabase): Promise<void> {
    await db.runAsync('DELETE FROM workouts', []);
  },

  /** Quantos dos ids informados já existem no banco. */
  async countExisting(db: SqlDatabase, ids: string[]): Promise<number> {
    const CHUNK_SIZE = 500;
    let total = 0;
    for (let start = 0; start < ids.length; start += CHUNK_SIZE) {
      const chunk = ids.slice(start, start + CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(', ');
      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) AS total FROM workouts WHERE id IN (${placeholders})`,
        chunk,
      );
      total += row?.total ?? 0;
    }
    return total;
  },
};

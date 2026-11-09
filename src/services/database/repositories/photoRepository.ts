import type { WorkoutPhoto } from '../../../features/workout-photo/types/photo';
import type { SqlDatabase } from '../types';

type PhotoRow = {
  id: string;
  workout_id: string;
  original_image_path: string;
  generated_image_path: string;
  created_at: string;
};

const PHOTO_COLUMNS = 'id, workout_id, original_image_path, generated_image_path, created_at';

function toPhoto(row: PhotoRow): WorkoutPhoto {
  return {
    id: row.id,
    workoutId: row.workout_id,
    originalImagePath: row.original_image_path,
    generatedImagePath: row.generated_image_path,
    createdAt: row.created_at,
  };
}

/**
 * Metadados das fotos no SQLite. As imagens ficam em arquivos do app; o banco
 * guarda apenas os caminhos, nunca o conteúdo da imagem.
 */
export const photoRepository = {
  async findAll(db: SqlDatabase): Promise<WorkoutPhoto[]> {
    const rows = await db.getAllAsync<PhotoRow>(`SELECT ${PHOTO_COLUMNS} FROM workout_photos`, []);
    return rows.map(toPhoto);
  },

  async findByWorkoutId(db: SqlDatabase, workoutId: string): Promise<WorkoutPhoto | null> {
    const row = await db.getFirstAsync<PhotoRow>(`SELECT ${PHOTO_COLUMNS} FROM workout_photos WHERE workout_id = ?`, [
      workoutId,
    ]);
    return row ? toPhoto(row) : null;
  },

  /**
   * Cada treino tem no máximo uma foto (`workout_id` é UNIQUE): uma nova foto
   * substitui os caminhos da anterior. A chave estrangeira impede fotos órfãs.
   */
  async upsert(db: SqlDatabase, photo: WorkoutPhoto): Promise<void> {
    await db.runAsync(
      `INSERT INTO workout_photos (${PHOTO_COLUMNS}) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (workout_id) DO UPDATE SET
         original_image_path = excluded.original_image_path,
         generated_image_path = excluded.generated_image_path,
         created_at = excluded.created_at`,
      [photo.id, photo.workoutId, photo.originalImagePath, photo.generatedImagePath, photo.createdAt],
    );
  },

  async removeByWorkoutId(db: SqlDatabase, workoutId: string): Promise<boolean> {
    const result = await db.runAsync('DELETE FROM workout_photos WHERE workout_id = ?', [workoutId]);
    return result.changes > 0;
  },

  /** Todos os caminhos de arquivo referenciados pelo banco. */
  async findAllPaths(db: SqlDatabase): Promise<string[]> {
    const photos = await photoRepository.findAll(db);
    return photos.flatMap((photo) => [photo.originalImagePath, photo.generatedImagePath]);
  },
};

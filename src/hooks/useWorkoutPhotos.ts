import { useCallback } from 'react';

import { useAppData } from '../contexts/AppDataContext';
import type { WorkoutPhoto } from '../features/workout-photo/types/photo';

/** Fotos vinculadas aos treinos (metadados no SQLite, imagens em arquivos do app). */
export function useWorkoutPhotos() {
  const { photosByWorkoutId, saveWorkoutPhoto, removeWorkoutPhoto } = useAppData();

  const getPhoto = useCallback(
    (workoutId: string): WorkoutPhoto | null => photosByWorkoutId[workoutId] ?? null,
    [photosByWorkoutId],
  );

  return { photosByWorkoutId, getPhoto, saveWorkoutPhoto, removeWorkoutPhoto };
}

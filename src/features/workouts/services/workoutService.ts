import { photoRepository } from '../../../services/database/repositories/photoRepository';
import { workoutRepository } from '../../../services/database/repositories/workoutRepository';
import type { SqlDatabase } from '../../../services/database/types';
import { generateId } from '../../../utils/id';
import { deleteWorkoutPhotoFiles } from '../../workout-photo/services/photoService';
import type { Workout, WorkoutInput } from '../types/workout';

/*
 * Regras de persistência dos treinos. O ranking não é tocado aqui: ele é sempre
 * recalculado a partir da lista de treinos, então registrar uma foto, por exemplo,
 * nunca gera pontos.
 */

/** "Finalizar treino": cria um registro novo; cada finalização gera um único treino. */
export async function createWorkout(db: SqlDatabase, input: WorkoutInput): Promise<Workout> {
  const workout: Workout = { ...input, id: generateId(), createdAt: new Date().toISOString() };
  await workoutRepository.insert(db, workout);
  return workout;
}

/** Mantém id e momento do registro originais (usados pelo ranking e pelo crédito semanal). */
export async function updateWorkout(db: SqlDatabase, existing: Workout, input: WorkoutInput): Promise<Workout> {
  const updated: Workout = { ...input, id: existing.id, createdAt: existing.createdAt };
  await workoutRepository.update(db, updated);
  return updated;
}

/**
 * Exclui o treino; o banco remove grupos, exercícios e o registro da foto em
 * cascata, e em seguida os arquivos de imagem são apagados para não sobrarem órfãos.
 */
export async function deleteWorkout(db: SqlDatabase, workoutId: string): Promise<void> {
  const photo = await photoRepository.findByWorkoutId(db, workoutId);
  await workoutRepository.remove(db, workoutId);
  if (photo) deleteWorkoutPhotoFiles(photo);
}

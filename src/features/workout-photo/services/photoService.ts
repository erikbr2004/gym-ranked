import { photoRepository } from '../../../services/database/repositories/photoRepository';
import type { SqlDatabase } from '../../../services/database/types';
import {
  deleteStoredFiles,
  listStoredPhotoPaths,
  resolveStoredImage,
  storePhotoFile,
} from '../../../services/filesystem/photoFileStorage';
import { getImageExtension } from '../../../utils/files';
import { generateId } from '../../../utils/id';
import type { StoredImage, WorkoutPhoto } from '../types/photo';

/*
 * Orquestra arquivos (FileSystem) e metadados (SQLite) das fotos.
 * Ordem segura ao salvar: copia os arquivos → grava o banco → só então apaga os
 * arquivos substituídos. Se o banco falhar, os arquivos novos são removidos.
 */

/** Foto escolhida na tela: nova (câmera/galeria) ou a original já guardada no app. */
export type PhotoSource = {
  uri: string;
  /** Caminho relativo quando a foto já é a original armazenada do treino. */
  storedPath?: string;
};

export type SaveWorkoutPhotoParams = {
  workoutId: string;
  source: PhotoSource;
  /** Arquivo temporário da composição gerada pelo captureRef. */
  compositionUri: string;
};

export async function saveWorkoutPhoto(db: SqlDatabase, params: SaveWorkoutPhotoParams): Promise<WorkoutPhoto> {
  const { workoutId, source, compositionUri } = params;
  const previous = await photoRepository.findByWorkoutId(db, workoutId);
  const baseName = `${workoutId}-${Date.now().toString(36)}`;
  const createdPaths: string[] = [];

  try {
    let originalPath = source.storedPath;
    if (!originalPath) {
      originalPath = await storePhotoFile(source.uri, `${baseName}-original.${getImageExtension(source.uri)}`);
      createdPaths.push(originalPath);
    }
    const generatedPath = await storePhotoFile(compositionUri, `${baseName}-gymrank.jpg`);
    createdPaths.push(generatedPath);

    const photo: WorkoutPhoto = {
      id: previous?.id ?? generateId(),
      workoutId,
      originalImagePath: originalPath,
      generatedImagePath: generatedPath,
      createdAt: new Date().toISOString(),
    };
    await photoRepository.upsert(db, photo);

    if (previous) {
      const replaced = [previous.originalImagePath, previous.generatedImagePath].filter(
        (path) => path !== photo.originalImagePath && path !== photo.generatedImagePath,
      );
      deleteStoredFiles(replaced);
    }
    return photo;
  } catch (error) {
    deleteStoredFiles(createdPaths);
    throw error;
  }
}

export function deleteWorkoutPhotoFiles(photo: WorkoutPhoto): void {
  deleteStoredFiles([photo.originalImagePath, photo.generatedImagePath]);
}

/** Remove a foto do treino (registro e arquivos) sem excluir o treino. */
export async function removeWorkoutPhoto(db: SqlDatabase, workoutId: string): Promise<void> {
  const photo = await photoRepository.findByWorkoutId(db, workoutId);
  if (!photo) return;
  await photoRepository.removeByWorkoutId(db, workoutId);
  deleteWorkoutPhotoFiles(photo);
}

/**
 * Apaga arquivos de foto que nenhum registro do banco referencia (ex.: o app foi
 * fechado no meio de um salvamento). Executada na abertura do app.
 */
export async function cleanupOrphanPhotoFiles(db: SqlDatabase): Promise<number> {
  const referenced = new Set(await photoRepository.findAllPaths(db));
  const orphans = listStoredPhotoPaths().filter((path) => !referenced.has(path));
  deleteStoredFiles(orphans);
  return orphans.length;
}

export function getWorkoutPhotoImages(photo: WorkoutPhoto): { original: StoredImage; composition: StoredImage } {
  return {
    original: resolveStoredImage(photo.originalImagePath),
    composition: resolveStoredImage(photo.generatedImagePath),
  };
}

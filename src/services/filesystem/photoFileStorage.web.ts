import type { StoredImage } from '../../features/workout-photo/types/photo';

/*
 * Versão para a pré-visualização no navegador: o expo-file-system não tem
 * armazenamento persistente na web, então salvar fotos fica disponível apenas
 * no app para celular (Expo Go). Mesma API da versão nativa.
 */

export const PHOTO_DIRECTORY_NAME = 'workout-photos';
export const PROFILE_PHOTO_DIRECTORY_NAME = 'profile-photo';

export class PhotoStorageError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'PhotoStorageError';
  }
}

export function isPhotoStorageSupported(): boolean {
  return false;
}

export function toFileUri(uriOrPath: string): string {
  return uriOrPath;
}

export async function storePhotoFile(): Promise<string> {
  throw new PhotoStorageError('Salvar fotos está disponível no app para celular (Expo Go).');
}

export function resolveStoredImage(): StoredImage {
  return { uri: '', exists: false };
}

export function deleteStoredFiles(): void {}

export function listStoredPhotoPaths(): string[] {
  return [];
}

export function deleteAllStoredPhotos(): void {}

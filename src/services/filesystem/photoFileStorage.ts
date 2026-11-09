import { Directory, File, Paths } from 'expo-file-system';

import type { StoredImage } from '../../features/workout-photo/types/photo';

/*
 * Arquivos das fotos (treinos e perfil) no diretório de documentos do app, que o sistema
 * não apaga sozinho (diferente do cache, onde a câmera e o captureRef gravam).
 * O banco guarda caminhos RELATIVOS a esse diretório.
 */

export const PHOTO_DIRECTORY_NAME = 'workout-photos';
/** Pasta separada para a foto de perfil (referenciada pelo perfil no AsyncStorage). */
export const PROFILE_PHOTO_DIRECTORY_NAME = 'profile-photo';

/** Erro de arquivo com mensagem pronta para ser exibida ao usuário. */
export class PhotoStorageError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'PhotoStorageError';
  }
}

export function isPhotoStorageSupported(): boolean {
  return true;
}

function photoDirectory(directoryName: string): Directory {
  return new Directory(Paths.document, directoryName);
}

/** Câmera e captureRef podem devolver caminhos sem o esquema `file://` (iOS). */
export function toFileUri(uriOrPath: string): string {
  return uriOrPath.includes('://') ? uriOrPath : `file://${uriOrPath}`;
}

/**
 * Copia uma imagem (cache da câmera, galeria ou captura) para o armazenamento
 * persistente e retorna o caminho relativo gravado no SQLite.
 */
export async function storePhotoFile(
  sourceUri: string,
  fileName: string,
  directoryName: string = PHOTO_DIRECTORY_NAME,
): Promise<string> {
  const source = new File(toFileUri(sourceUri));
  if (!source.exists) {
    throw new PhotoStorageError('A imagem não está mais disponível no aparelho. Tire ou escolha a foto novamente.');
  }

  try {
    const directory = photoDirectory(directoryName);
    directory.create({ idempotent: true, intermediates: true });
    await source.copy(new File(directory, fileName));
  } catch (error) {
    throw new PhotoStorageError('Não foi possível salvar a imagem no aparelho.', error);
  }
  return `${directoryName}/${fileName}`;
}

export function resolveStoredImage(relativePath: string): StoredImage {
  const file = new File(Paths.document, relativePath);
  return { uri: file.uri, exists: file.exists };
}

/** Apaga arquivos ignorando os que já não existem; uma falha não interrompe os demais. */
export function deleteStoredFiles(relativePaths: readonly string[]): void {
  for (const relativePath of relativePaths) {
    try {
      const file = new File(Paths.document, relativePath);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn(`[photos] Não foi possível apagar "${relativePath}".`, error);
    }
  }
}

export function listStoredPhotoPaths(directoryName: string = PHOTO_DIRECTORY_NAME): string[] {
  const directory = photoDirectory(directoryName);
  if (!directory.exists) return [];
  return directory
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .map((file) => `${directoryName}/${file.name}`);
}

/** Apaga a pasta de fotos inteira; falhas viram aviso (a limpeza de órfãos cobre sobras). */
export function deleteAllStoredPhotos(directoryName: string = PHOTO_DIRECTORY_NAME): void {
  try {
    const directory = photoDirectory(directoryName);
    if (directory.exists) directory.delete();
  } catch (error) {
    console.warn(`[photos] Não foi possível apagar a pasta "${directoryName}".`, error);
  }
}

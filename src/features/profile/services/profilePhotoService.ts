import {
  PROFILE_PHOTO_DIRECTORY_NAME,
  deleteAllStoredPhotos,
  deleteStoredFiles,
  listStoredPhotoPaths,
  resolveStoredImage,
  storePhotoFile,
} from '../../../services/filesystem/photoFileStorage';
import { profileStorage } from '../../../services/storage/profileStorage';
import { getImageExtension } from '../../../utils/files';
import type { StoredImage } from '../../workout-photo/types/photo';
import type { Profile } from '../types/profile';

/*
 * Foto de perfil: o arquivo fica na pasta de documentos do app (FileSystem) e o
 * perfil, no AsyncStorage, guarda apenas o caminho relativo (nunca a imagem).
 * Mesma ordem segura das fotos de treino: copia o arquivo → grava o perfil →
 * só então apaga a foto anterior. Se a gravação falhar, o arquivo novo é removido.
 */

export async function saveProfilePhoto(profile: Profile, sourceUri: string): Promise<Profile> {
  const fileName = `avatar-${Date.now().toString(36)}.${getImageExtension(sourceUri)}`;
  const avatarPath = await storePhotoFile(sourceUri, fileName, PROFILE_PHOTO_DIRECTORY_NAME);
  const next: Profile = { ...profile, avatarPath };

  try {
    await profileStorage.save(next);
  } catch (error) {
    deleteStoredFiles([avatarPath]);
    throw error;
  }

  if (profile.avatarPath && profile.avatarPath !== avatarPath) deleteStoredFiles([profile.avatarPath]);
  return next;
}

/** Volta ao avatar padrão: grava o perfil sem a foto e depois apaga o arquivo. */
export async function removeProfilePhoto(profile: Profile): Promise<Profile> {
  const { avatarPath, ...next } = profile;
  if (!avatarPath) return profile;

  await profileStorage.save(next);
  deleteStoredFiles([avatarPath]);
  return next;
}

/** Arquivos da pasta de perfil que o perfil atual não referencia. */
export function findOrphanProfilePhotos(storedPaths: readonly string[], currentPath: string | undefined): string[] {
  return storedPaths.filter((path) => path !== currentPath);
}

/**
 * Apaga fotos de perfil que sobraram (ex.: o app fechou no meio de uma troca).
 * É só manutenção: falhas viram aviso e nunca interrompem quem chamou.
 */
export function cleanupOrphanProfilePhotos(currentPath: string | undefined): number {
  try {
    const orphans = findOrphanProfilePhotos(listStoredPhotoPaths(PROFILE_PHOTO_DIRECTORY_NAME), currentPath);
    deleteStoredFiles(orphans);
    return orphans.length;
  } catch (error) {
    console.warn('[profile] Falha ao limpar fotos de perfil antigas.', error);
    return 0;
  }
}

export function deleteAllProfilePhotos(): void {
  deleteAllStoredPhotos(PROFILE_PHOTO_DIRECTORY_NAME);
}

export function getProfilePhotoImage(avatarPath: string | undefined): StoredImage | null {
  return avatarPath ? resolveStoredImage(avatarPath) : null;
}

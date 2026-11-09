import { Asset, requestPermissionsAsync } from 'expo-media-library';

/** Permissão da galeria negada; `canAskAgain` indica se ainda dá para pedir de novo. */
export class GalleryPermissionError extends Error {
  constructor(readonly canAskAgain: boolean) {
    super('Permita que o GymRank salve fotos na galeria para usar esta opção.');
    this.name = 'GalleryPermissionError';
  }
}

export function isGallerySaveSupported(): boolean {
  return true;
}

/**
 * Salva a imagem final na galeria do aparelho. Pede somente acesso de escrita
 * a fotos (sem leitura da galeria, áudio ou vídeo).
 */
export async function saveImageToGallery(fileUri: string): Promise<void> {
  const permission = await requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) throw new GalleryPermissionError(permission.canAskAgain);
  await Asset.create(fileUri);
}

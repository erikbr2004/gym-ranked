/*
 * Versão para a pré-visualização no navegador: o expo-media-library não tem
 * implementação web. Mesma API da versão nativa.
 */

export class GalleryPermissionError extends Error {
  constructor(readonly canAskAgain: boolean) {
    super('Permita que o GymRank salve fotos na galeria para usar esta opção.');
    this.name = 'GalleryPermissionError';
  }
}

export function isGallerySaveSupported(): boolean {
  return false;
}

export async function saveImageToGallery(): Promise<void> {
  throw new Error('Salvar na galeria está disponível no app para celular (Expo Go).');
}

import { Linking } from 'react-native';

import { confirmAction, getErrorMessage, showMessage } from '../../../utils/dialogs';
import { GalleryPermissionError } from '../services/deviceGallery';

export type PhotoAction = 'save' | 'share' | 'gallery' | 'remove';

const ERROR_TITLES: Record<PhotoAction, string> = {
  save: 'Não foi possível salvar a foto',
  share: 'Não foi possível compartilhar',
  gallery: 'Não foi possível salvar na galeria',
  remove: 'Não foi possível remover a foto',
};

/** Mostra ao usuário uma mensagem adequada para cada falha nas ações da foto. */
export async function reportPhotoError(action: PhotoAction, error: unknown): Promise<void> {
  if (error instanceof GalleryPermissionError) {
    const openSettings = await confirmAction({
      title: 'Sem acesso à galeria',
      message: `${error.message} Você também pode usar "Compartilhar" e salvar a imagem por lá.`,
      confirmLabel: 'Abrir configurações',
    });
    if (openSettings) await Linking.openSettings();
    return;
  }
  showMessage(ERROR_TITLES[action], getErrorMessage(error));
}

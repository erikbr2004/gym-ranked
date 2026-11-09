import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { confirmAction, getErrorMessage, showMessage, type PhotoSourceChoice } from '../../../utils/dialogs';
import { pickPhotoFromLibrary, takePhotoWithCamera, type PickPhotoOptions } from '../services/photoPicker';

const WORKOUT_CAMERA_DENIED_MESSAGE =
  'Para fotografar o treino, permita o acesso à câmera nas configurações do aparelho. ' +
  'Você também pode escolher uma foto da galeria. O treino já está salvo.';

async function explainCameraPermission(message: string): Promise<void> {
  const openSettings = await confirmAction({
    title: 'Câmera sem permissão',
    message,
    confirmLabel: 'Abrir configurações',
  });
  if (openSettings) await Linking.openSettings();
}

type UsePhotoPickerOptions = PickPhotoOptions & {
  /** Explicação exibida quando a câmera está sem permissão. */
  cameraDeniedMessage?: string;
};

/**
 * Câmera ou galeria com todos os desfechos tratados: foto escolhida (retorna o
 * URI), cancelamento (retorna `null` sem mensagens), permissão negada e erros.
 */
export function usePhotoPicker({
  square = false,
  cameraDeniedMessage = WORKOUT_CAMERA_DENIED_MESSAGE,
}: UsePhotoPickerOptions = {}) {
  const [isPicking, setIsPicking] = useState(false);

  const pickPhoto = useCallback(
    async (source: PhotoSourceChoice): Promise<string | null> => {
      setIsPicking(true);
      try {
        const options = { square };
        const result = source === 'camera' ? await takePhotoWithCamera(options) : await pickPhotoFromLibrary(options);
        if (result.status === 'permission-denied') {
          await explainCameraPermission(cameraDeniedMessage);
          return null;
        }
        return result.status === 'picked' ? result.uri : null;
      } catch (error) {
        showMessage(
          source === 'camera' ? 'Não foi possível usar a câmera' : 'Não foi possível abrir a galeria',
          getErrorMessage(error),
        );
        return null;
      } finally {
        setIsPicking(false);
      }
    },
    [square, cameraDeniedMessage],
  );

  return { pickPhoto, isPicking };
}

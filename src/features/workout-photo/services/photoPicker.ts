import { Platform } from 'react-native';
import {
  getCameraPermissionsAsync,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  type ImagePickerOptions,
  type ImagePickerResult,
} from 'expo-image-picker';

/*
 * Captura de fotos com o expo-image-picker. A permissão da câmera é sempre
 * verificada antes (nunca presumida) e só é pedida quando a câmera vai abrir.
 * A galeria usa o seletor do sistema, que não exige permissão.
 */

export type PickPhotoResult =
  | { status: 'picked'; uri: string }
  | { status: 'canceled' }
  | { status: 'permission-denied'; canAskAgain: boolean };

export type PickPhotoOptions = {
  /** Abre o recorte quadrado antes de devolver a foto (usado na foto de perfil). */
  square?: boolean;
};

const PICKER_OPTIONS: ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  exif: false,
};

function getPickerOptions({ square = false }: PickPhotoOptions): ImagePickerOptions {
  return square ? { ...PICKER_OPTIONS, allowsEditing: true, aspect: [1, 1] } : PICKER_OPTIONS;
}

function toPickResult(result: ImagePickerResult): PickPhotoResult {
  if (result.canceled) return { status: 'canceled' };
  const uri = result.assets[0]?.uri;
  return uri ? { status: 'picked', uri } : { status: 'canceled' };
}

async function ensureCameraPermission(): Promise<PickPhotoResult | null> {
  // No navegador a permissão é tratada pelo próprio seletor de arquivos.
  if (Platform.OS === 'web') return null;

  let permission = await getCameraPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await requestCameraPermissionsAsync();
  }
  return permission.granted ? null : { status: 'permission-denied', canAskAgain: permission.canAskAgain };
}

export async function takePhotoWithCamera(options: PickPhotoOptions = {}): Promise<PickPhotoResult> {
  const denied = await ensureCameraPermission();
  if (denied) return denied;
  return toPickResult(await launchCameraAsync(getPickerOptions(options)));
}

export async function pickPhotoFromLibrary(options: PickPhotoOptions = {}): Promise<PickPhotoResult> {
  return toPickResult(await launchImageLibraryAsync(getPickerOptions(options)));
}

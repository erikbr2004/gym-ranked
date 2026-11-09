import { isAvailableAsync, shareAsync } from 'expo-sharing';

/** Abre a folha de compartilhamento do sistema com a imagem final (JPG local). */
export async function shareImageFile(fileUri: string): Promise<void> {
  if (!(await isAvailableAsync())) {
    throw new Error('O compartilhamento não está disponível neste aparelho.');
  }
  await shareAsync(fileUri, {
    mimeType: 'image/jpeg',
    UTI: 'public.jpeg',
    dialogTitle: 'Compartilhar treino',
  });
}

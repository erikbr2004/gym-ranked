import type { RefObject } from 'react';
import { PixelRatio, Platform, type ViewInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/*
 * Exportação da composição (foto + informações) como um arquivo JPG real,
 * usando react-native-view-shot. Somente a view da composição é capturada:
 * botões e controles da tela ficam fora dela e nunca entram na imagem.
 */

/** Formato vertical 9:16, adequado para stories. */
export const EXPORT_SIZE_PX = { width: 1080, height: 1920 } as const;

/**
 * Largura de layout (em dp) que corresponde a exatamente 1080 px no aparelho.
 * A composição é desenhada nesse tamanho e apenas reduzida visualmente na tela,
 * para que a captura saia na resolução final sem ampliação (e sem perder nitidez).
 */
export function getExportLayoutWidth(): number {
  return EXPORT_SIZE_PX.width / PixelRatio.get();
}

/** O view-shot recebe pixels no Android e pontos (multiplicados pela escala da tela) no iOS. */
function getCaptureSizeOptions(): { width: number; height: number } {
  if (Platform.OS === 'ios') {
    const scale = PixelRatio.get();
    return { width: EXPORT_SIZE_PX.width / scale, height: EXPORT_SIZE_PX.height / scale };
  }
  return { width: EXPORT_SIZE_PX.width, height: EXPORT_SIZE_PX.height };
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Captura a composição e devolve o arquivo temporário gerado.
 * Só deve ser chamada depois que a foto disparou `onLoad`; aguardamos ainda dois
 * quadros para garantir que a última personalização já foi desenhada.
 */
export async function exportComposition(viewRef: RefObject<ViewInstance | null>): Promise<string> {
  if (!viewRef.current) throw new Error('A composição ainda não está pronta.');
  await waitForNextFrame();
  await waitForNextFrame();

  try {
    return await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.92,
      result: 'tmpfile',
      ...getCaptureSizeOptions(),
    });
  } catch (error) {
    console.warn('[photos] Falha no captureRef.', error);
    throw new Error('Não foi possível gerar a imagem do treino. Tente novamente.');
  }
}

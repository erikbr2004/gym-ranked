import { useMemo, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type ViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '../../../components/AppButton';
import { EmptyState } from '../../../components/EmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, fontSize, fontWeight, photoAccentColors, radius, sizes, spacing } from '../../../constants/theme';
import { useSettings } from '../../../hooks/useSettings';
import { useWorkoutContributions } from '../../../hooks/useWorkoutContributions';
import { useWorkoutPhotos } from '../../../hooks/useWorkoutPhotos';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { RootStackScreenProps } from '../../../navigation/navigationTypes';
import { isPhotoStorageSupported } from '../../../services/filesystem/photoFileStorage';
import type { AppSettings } from '../../../services/storage/settingsStorage';
import { getErrorMessage, showMessage, type PhotoSourceChoice } from '../../../utils/dialogs';
import type { Workout } from '../../workouts/types/workout';
import { PhotoCustomizationBar } from '../components/PhotoCustomizationBar';
import { PHOTO_ASPECT_RATIO, WorkoutPhotoTemplate } from '../components/WorkoutPhotoTemplate';
import { usePhotoPicker } from '../hooks/usePhotoPicker';
import { EXPORT_SIZE_PX, exportComposition, getExportLayoutWidth } from '../services/compositionExport';
import { saveImageToGallery } from '../services/deviceGallery';
import { shareImageFile } from '../services/imageSharing';
import { buildWorkoutPhotoData, hasPointsToShow } from '../services/photoData';
import { getWorkoutPhotoImages, type PhotoSource } from '../services/photoService';
import type { WorkoutPhoto } from '../types/photo';
import { reportPhotoError } from '../utils/reportPhotoError';

type ImageStatus = 'loading' | 'ready' | 'error';
type ExportAction = 'save' | 'share' | 'gallery';

const BUSY_MESSAGES: Record<ExportAction, string> = {
  save: 'Gerando e salvando a imagem...',
  share: 'Preparando a imagem...',
  gallery: 'Salvando na galeria...',
};

export function WorkoutPhotoScreen({ navigation, route }: RootStackScreenProps<'WorkoutPhoto'>) {
  const { getWorkoutById } = useWorkouts();
  const { workoutId, photoUri, storedOriginalPath, origin } = route.params;
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return (
      <ScreenContainer edges={['bottom']}>
        <EmptyState icon="alert-circle-outline" title="Treino não encontrado" message="Ele pode ter sido excluído." />
      </ScreenContainer>
    );
  }

  const finish = () => {
    if (origin === 'completion') {
      navigation.popTo('MainTabs', { screen: 'History' });
    } else {
      navigation.popTo('WorkoutDetails', { workoutId });
    }
  };

  return <PhotoComposer workout={workout} initialSource={{ uri: photoUri, storedPath: storedOriginalPath }} onFinish={finish} />;
}

type PhotoComposerProps = {
  workout: Workout;
  initialSource: PhotoSource;
  onFinish: () => void;
};

/**
 * Tela de personalização: pré-visualiza a composição 9:16 com os dados reais do
 * treino e gera o arquivo final para salvar no treino, na galeria ou compartilhar.
 */
function PhotoComposer({ workout, initialSource, onFinish }: PhotoComposerProps) {
  const { settings, updateSettings } = useSettings();
  const { saveWorkoutPhoto } = useWorkoutPhotos();
  const contributions = useWorkoutContributions(workout);
  const data = useMemo(() => buildWorkoutPhotoData(workout, contributions), [workout, contributions]);
  const { pickPhoto, isPicking } = usePhotoPicker();
  const templateRef = useRef<ViewInstance>(null);
  // Trava imediata contra toques duplos (o estado `busyAction` só vale no próximo render).
  const busyRef = useRef(false);

  const [source, setSource] = useState<PhotoSource>(initialSource);
  const [imageStatus, setImageStatus] = useState<ImageStatus>('loading');
  const [saved, setSaved] = useState<{ signature: string; photo: WorkoutPhoto } | null>(null);
  const [busyAction, setBusyAction] = useState<ExportAction | null>(null);
  const [previewArea, setPreviewArea] = useState<{ width: number; height: number } | null>(null);

  const pointsAvailable = hasPointsToShow(data);
  const showPoints = settings.photoShowPoints && pointsAvailable;
  // Qualquer mudança na foto, nos dados ou na personalização exige gerar a imagem de novo.
  const signature = JSON.stringify([source.uri, settings.photoShowRanks, showPoints, settings.photoAccent, data]);
  const isSaved = saved?.signature === signature;
  const isBusy = busyAction !== null || isPicking;

  const layoutWidth = getExportLayoutWidth();
  const layoutHeight = layoutWidth / PHOTO_ASPECT_RATIO;
  const previewWidth = previewArea ? Math.min(previewArea.width, previewArea.height * PHOTO_ASPECT_RATIO) : 0;

  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewArea((current) =>
      current && current.width === width && current.height === height ? current : { width, height },
    );
  };

  const changeSettings = (changes: Partial<AppSettings>) => {
    updateSettings(changes).catch((error: unknown) => showMessage('Preferência não salva', getErrorMessage(error)));
  };

  const replacePhoto = async (choice: PhotoSourceChoice) => {
    const uri = await pickPhoto(choice);
    if (!uri) return;
    setSource({ uri });
    setImageStatus('loading');
  };

  /** Gera o JPG final e o vincula ao treino (arquivo + SQLite). Reaproveita se nada mudou. */
  const persistComposition = async (): Promise<WorkoutPhoto> => {
    if (saved && saved.signature === signature) return saved.photo;
    const compositionUri = await exportComposition(templateRef);
    const photo = await saveWorkoutPhoto({ workoutId: workout.id, source, compositionUri });
    // A original agora está guardada no app: novas versões reaproveitam esse arquivo.
    setSource((current) => ({ ...current, storedPath: photo.originalImagePath }));
    setSaved({ signature, photo });
    return photo;
  };

  const runExportAction = async (action: ExportAction, afterPersist: (photo: WorkoutPhoto) => Promise<void> | void) => {
    if (!isPhotoStorageSupported()) {
      showMessage(
        'Disponível no celular',
        'Salvar e compartilhar a imagem funciona no app (Expo Go). No navegador há apenas a pré-visualização.',
      );
      return;
    }
    if (imageStatus !== 'ready' || isBusy || busyRef.current) return;

    busyRef.current = true;
    setBusyAction(action);
    try {
      const photo = await persistComposition();
      await afterPersist(photo);
    } catch (error) {
      await reportPhotoError(action, error);
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  const handleSave = () => {
    if (isSaved) {
      onFinish();
      return;
    }
    void runExportAction('save', () => {
      showMessage('Foto salva', 'A imagem ficou vinculada ao treino e pode ser vista no histórico.');
      onFinish();
    });
  };

  const handleShare = () =>
    void runExportAction('share', (photo) => shareImageFile(getWorkoutPhotoImages(photo).composition.uri));

  const handleSaveToGallery = () =>
    void runExportAction('gallery', async (photo) => {
      await saveImageToGallery(getWorkoutPhotoImages(photo).composition.uri);
      showMessage('Salva na galeria', 'A imagem do treino está na galeria do aparelho.');
    });

  const canExport = imageStatus === 'ready' && !isBusy;

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.previewArea} onLayout={handlePreviewLayout}>
          {previewWidth > 0 && (
            <View style={[styles.previewFrame, { width: previewWidth, height: previewWidth / PHOTO_ASPECT_RATIO }]}>
              {/* Desenhada em 1080 px e apenas reduzida na tela: a captura sai na resolução final. */}
              <View
                style={[
                  styles.scaledLayer,
                  { width: layoutWidth, height: layoutHeight, transform: [{ scale: previewWidth / layoutWidth }] },
                ]}
              >
                <WorkoutPhotoTemplate
                  key={source.uri}
                  ref={templateRef}
                  photoUri={source.uri}
                  data={data}
                  width={layoutWidth}
                  accentColor={photoAccentColors[settings.photoAccent]}
                  showRanks={settings.photoShowRanks}
                  showPoints={showPoints}
                  onImageLoad={() => setImageStatus('ready')}
                  onImageError={() => setImageStatus('error')}
                />
              </View>

              {imageStatus === 'loading' && <PreviewOverlay spinner message="Carregando a foto..." />}
              {imageStatus === 'error' && (
                <PreviewOverlay icon="image-outline" message="A foto não está mais disponível. Tire ou escolha outra." />
              )}
              {busyAction && <PreviewOverlay spinner message={BUSY_MESSAGES[busyAction]} />}
            </View>
          )}
        </View>

        <View style={styles.statusRow}>
          <Ionicons
            name={isSaved ? 'checkmark-circle' : 'information-circle-outline'}
            size={sizes.iconSm}
            color={isSaved ? colors.success : colors.textSubtle}
          />
          <Text style={[styles.statusText, isSaved && styles.statusSaved]}>
            {isSaved
              ? 'Imagem salva no treino'
              : `Pré-visualização · imagem final ${EXPORT_SIZE_PX.width} × ${EXPORT_SIZE_PX.height} px`}
          </Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppButton
                label="Refazer foto"
                variant="secondary"
                icon="camera-reverse-outline"
                onPress={() => replacePhoto('camera')}
                disabled={isBusy}
              />
            </View>
            <View style={styles.flex}>
              <AppButton
                label="Da galeria"
                variant="secondary"
                icon="images-outline"
                onPress={() => replacePhoto('library')}
                disabled={isBusy}
              />
            </View>
          </View>

          <PhotoCustomizationBar
            showRanks={settings.photoShowRanks}
            showPoints={settings.photoShowPoints}
            accent={settings.photoAccent}
            pointsAvailable={pointsAvailable}
            disabled={isBusy}
            onChange={changeSettings}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <AppButton
                label="Galeria"
                variant="secondary"
                icon="download-outline"
                onPress={handleSaveToGallery}
                disabled={!canExport}
                loading={busyAction === 'gallery'}
                accessibilityHint="Salva a imagem final na galeria do aparelho"
              />
            </View>
            <View style={styles.flex}>
              <AppButton
                label="Compartilhar"
                variant="secondary"
                icon="share-social-outline"
                onPress={handleShare}
                disabled={!canExport}
                loading={busyAction === 'share'}
              />
            </View>
          </View>

          <AppButton
            label={isSaved ? 'Concluir' : 'Salvar no treino'}
            icon="checkmark-circle-outline"
            onPress={handleSave}
            disabled={!isSaved && !canExport}
            loading={busyAction === 'save'}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

type PreviewOverlayProps = {
  message: string;
  spinner?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

/** Fica por cima da pré-visualização, fora da view capturada: nunca entra na imagem. */
function PreviewOverlay({ message, spinner = false, icon }: PreviewOverlayProps) {
  return (
    <View style={styles.overlay} accessibilityLiveRegion="polite">
      {spinner && <ActivityIndicator color={colors.primary} size="large" />}
      {icon && <Ionicons name={icon} size={36} color={colors.textMuted} />}
      <Text style={styles.overlayText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewArea: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scaledLayer: {
    transformOrigin: 'top left',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  overlayText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statusText: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
  },
  statusSaved: {
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  controls: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});

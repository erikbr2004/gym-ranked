import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../../../components/AppButton';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import { useWorkoutPhotos } from '../../../hooks/useWorkoutPhotos';
import { formatIsoTimestamp } from '../../../utils/date';
import { choosePhotoSource, confirmAction, showMessage } from '../../../utils/dialogs';
import type { Workout } from '../../workouts/types/workout';
import { usePhotoPicker } from '../hooks/usePhotoPicker';
import { saveImageToGallery } from '../services/deviceGallery';
import { shareImageFile } from '../services/imageSharing';
import { getWorkoutPhotoImages } from '../services/photoService';
import { reportPhotoError, type PhotoAction } from '../utils/reportPhotoError';
import { PHOTO_ASPECT_RATIO } from './WorkoutPhotoTemplate';

type PhotoView = 'composition' | 'original';

type WorkoutPhotoSectionProps = {
  workout: Workout;
};

/** Foto vinculada ao treino nos detalhes do histórico: ver, compartilhar, substituir e remover. */
export function WorkoutPhotoSection({ workout }: WorkoutPhotoSectionProps) {
  const navigation = useNavigation();
  const { getPhoto, removeWorkoutPhoto } = useWorkoutPhotos();
  const { pickPhoto, isPicking } = usePhotoPicker();
  const photo = getPhoto(workout.id);
  const images = useMemo(() => (photo ? getWorkoutPhotoImages(photo) : null), [photo]);
  const [view, setView] = useState<PhotoView>('composition');
  const [busyAction, setBusyAction] = useState<PhotoAction | null>(null);
  const busyRef = useRef(false);

  const openEditor = (photoUri: string, storedOriginalPath?: string) => {
    navigation.navigate('WorkoutPhoto', { workoutId: workout.id, photoUri, storedOriginalPath, origin: 'details' });
  };

  const addOrReplacePhoto = async () => {
    const choice = await choosePhotoSource(photo ? 'Substituir foto' : 'Foto do treino');
    if (!choice) return;
    const uri = await pickPhoto(choice);
    if (uri) openEditor(uri);
  };

  const runAction = async (action: PhotoAction, task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction(action);
    try {
      await task();
    } catch (error) {
      await reportPhotoError(action, error);
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  const removePhoto = async () => {
    const confirmed = await confirmAction({
      title: 'Remover foto',
      message: 'A foto e a imagem gerada serão apagadas do aparelho. O treino e a pontuação continuam iguais.',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (confirmed) await runAction('remove', () => removeWorkoutPhoto(workout.id));
  };

  if (!photo || !images) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <MaterialCommunityIcons name="camera-plus-outline" size={sizes.iconLg} color={colors.primary} />
        <Text style={styles.emptyTitle}>Sem foto</Text>
        <Text style={styles.emptyText}>Registre uma foto deste treino e gere a imagem com os dados para compartilhar.</Text>
        <View style={styles.stretch}>
          <AppButton label="Adicionar foto" icon="camera-outline" onPress={addOrReplacePhoto} loading={isPicking} />
        </View>
      </View>
    );
  }

  const isBusy = busyAction !== null || isPicking;
  const displayed = view === 'composition' ? images.composition : images.original;

  return (
    <View style={styles.card}>
      <View style={styles.segmented} accessibilityRole="tablist">
        <SegmentButton label="Composição" active={view === 'composition'} onPress={() => setView('composition')} />
        <SegmentButton label="Original" active={view === 'original'} onPress={() => setView('original')} />
      </View>

      <View style={styles.imageFrame}>
        {displayed.exists ? (
          <Image
            source={{ uri: displayed.uri }}
            style={styles.image}
            resizeMode={view === 'composition' ? 'contain' : 'cover'}
            accessibilityLabel={view === 'composition' ? 'Imagem gerada do treino' : 'Foto original do treino'}
          />
        ) : (
          <View style={styles.missing}>
            <MaterialCommunityIcons name="image-off-outline" size={sizes.iconLg} color={colors.textSubtle} />
            <Text style={styles.emptyText}>Esta imagem não foi encontrada no aparelho.</Text>
          </View>
        )}
      </View>
      <Text style={styles.caption}>Registrada em {formatIsoTimestamp(photo.createdAt)}</Text>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <AppButton
            label="Compartilhar"
            variant="secondary"
            icon="share-social-outline"
            onPress={() => runAction('share', () => shareImageFile(images.composition.uri))}
            disabled={isBusy || !images.composition.exists}
            loading={busyAction === 'share'}
          />
        </View>
        <View style={styles.gridItem}>
          <AppButton
            label="Galeria"
            variant="secondary"
            icon="download-outline"
            onPress={() =>
              runAction('gallery', async () => {
                await saveImageToGallery(images.composition.uri);
                showMessage('Salva na galeria', 'A imagem do treino está na galeria do aparelho.');
              })
            }
            disabled={isBusy || !images.composition.exists}
            loading={busyAction === 'gallery'}
          />
        </View>
        <View style={styles.gridItem}>
          <AppButton
            label="Recriar"
            variant="secondary"
            icon="color-wand-outline"
            onPress={() => openEditor(images.original.uri, photo.originalImagePath)}
            disabled={isBusy || !images.original.exists}
            accessibilityHint="Gera a imagem de novo com os dados atuais do treino"
          />
        </View>
        <View style={styles.gridItem}>
          <AppButton
            label="Substituir"
            variant="secondary"
            icon="camera-reverse-outline"
            onPress={addOrReplacePhoto}
            disabled={isBusy}
            loading={isPicking}
          />
        </View>
      </View>
      <AppButton
        label="Remover foto"
        variant="danger"
        icon="trash-outline"
        onPress={removePhoto}
        disabled={isBusy}
        loading={busyAction === 'remove'}
      />
    </View>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 19,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  segmented: {
    flexDirection: 'row',
    padding: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  segment: {
    flex: 1,
    minHeight: sizes.touchTarget - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.surfacePressed,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  segmentLabelActive: {
    color: colors.text,
  },
  imageFrame: {
    alignSelf: 'center',
    width: '72%',
    aspectRatio: PHOTO_ASPECT_RATIO,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  caption: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
});

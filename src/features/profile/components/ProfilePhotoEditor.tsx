import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import { useProfilePhoto } from '../../../hooks/useProfilePhoto';
import { isPhotoStorageSupported } from '../../../services/filesystem/photoFileStorage';
import { choosePhotoSource, confirmAction, getErrorMessage, showMessage } from '../../../utils/dialogs';
import { usePhotoPicker } from '../../workout-photo/hooks/usePhotoPicker';

const PROFILE_CAMERA_DENIED_MESSAGE =
  'Para tirar a foto de perfil, permita o acesso à câmera nas configurações do aparelho. ' +
  'Você também pode escolher uma foto da galeria.';

type BusyAction = 'save' | 'remove';

/** Avatar do Perfil: tocar troca a foto (câmera ou galeria, com recorte quadrado). */
export function ProfilePhotoEditor() {
  const { photoUri, updateProfilePhoto, removeProfilePhoto } = useProfilePhoto();
  const { pickPhoto, isPicking } = usePhotoPicker({ square: true, cameraDeniedMessage: PROFILE_CAMERA_DENIED_MESSAGE });
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  // Trava imediata contra toques duplos (o estado só vale no próximo render).
  const busyRef = useRef(false);
  const hasPhoto = photoUri !== null;
  const isBusy = busyAction !== null || isPicking;

  const changePhoto = async () => {
    if (busyRef.current) return;
    if (!isPhotoStorageSupported()) {
      showMessage('Disponível no celular', 'Trocar a foto de perfil está disponível no app para celular (Expo Go).');
      return;
    }

    busyRef.current = true;
    try {
      const choice = await choosePhotoSource(
        hasPhoto ? 'Trocar foto de perfil' : 'Foto de perfil',
        'Escolha de onde vem a sua foto de perfil.',
      );
      if (!choice) return;
      const uri = await pickPhoto(choice);
      if (!uri) return;
      setBusyAction('save');
      await updateProfilePhoto(uri);
    } catch (error) {
      showMessage('Foto não salva', getErrorMessage(error));
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  const removePhoto = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const confirmed = await confirmAction({
        title: 'Remover foto de perfil',
        message: 'A foto será apagada do aparelho e o avatar padrão volta a aparecer.',
        confirmLabel: 'Remover',
        destructive: true,
      });
      if (!confirmed) return;
      setBusyAction('remove');
      await removeProfilePhoto();
    } catch (error) {
      showMessage('Foto não removida', getErrorMessage(error));
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={changePhoto}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? 'Foto de perfil. Trocar foto' : 'Adicionar foto de perfil'}
        accessibilityHint="Tire uma foto com a câmera ou escolha uma da galeria"
        accessibilityState={{ busy: isBusy }}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
      >
        <ProfileAvatar size={sizes.avatarLg} />
        <View style={styles.badge}>
          <Ionicons name={hasPhoto ? 'camera-reverse' : 'camera'} size={sizes.iconSm} color={colors.background} />
        </View>
        {isBusy && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </Pressable>

      {hasPhoto && (
        <Pressable
          onPress={removePhoto}
          disabled={isBusy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Remover foto de perfil"
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={sizes.iconSm} color={colors.textMuted} />
          <Text style={styles.removeLabel}>Remover foto</Text>
        </Pressable>
      )}
    </View>
  );
}

const BADGE_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarButton: {
    width: sizes.avatarLg,
    height: sizes.avatarLg,
    borderRadius: sizes.avatarLg / 2,
  },
  pressed: {
    opacity: 0.75,
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sizes.avatarLg / 2,
    backgroundColor: colors.overlay,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  removeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});

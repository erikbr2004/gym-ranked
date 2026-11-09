import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';

import { images } from '../constants/images';
import { colors } from '../constants/theme';
import { useProfilePhoto } from '../hooks/useProfilePhoto';

type ProfileAvatarProps = {
  size: number;
};

/** Foto de perfil em círculo; sem foto (ou se o arquivo falhar) mostra o avatar padrão. */
export function ProfileAvatar({ size }: ProfileAvatarProps) {
  const { photoUri } = useProfilePhoto();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showPhoto = photoUri !== null && photoUri !== failedUri;

  return (
    <Image
      source={showPhoto ? { uri: photoUri } : images.avatar}
      onError={showPhoto ? () => setFailedUri(photoUri) : undefined}
      resizeMode="cover"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={showPhoto ? 'Foto de perfil' : 'Avatar do usuário'}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.surface,
  },
});

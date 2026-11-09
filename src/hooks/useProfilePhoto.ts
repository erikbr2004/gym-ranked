import { useMemo } from 'react';

import { useAppData } from '../contexts/AppDataContext';
import { getProfilePhotoImage } from '../features/profile/services/profilePhotoService';

/** Foto de perfil atual (URI do arquivo, ou `null` para o avatar padrão) e as ações para trocá-la. */
export function useProfilePhoto() {
  const { profile, updateProfilePhoto, removeProfilePhoto } = useAppData();
  const image = useMemo(() => getProfilePhotoImage(profile.avatarPath), [profile.avatarPath]);

  return {
    photoUri: image?.exists ? image.uri : null,
    updateProfilePhoto,
    removeProfilePhoto,
  };
}

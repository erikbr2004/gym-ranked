import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  deleteStoredFiles,
  listStoredPhotoPaths,
  storePhotoFile,
} from '../../../../services/filesystem/photoFileStorage';
import { STORAGE_KEYS } from '../../../../services/storage/storageKeys';
import { parseProfile, profileStorage } from '../../../../services/storage/profileStorage';
import type { Profile } from '../../types/profile';
import {
  cleanupOrphanProfilePhotos,
  findOrphanProfilePhotos,
  removeProfilePhoto,
  saveProfilePhoto,
} from '../profilePhotoService';

jest.mock('../../../../services/filesystem/photoFileStorage', () => ({
  PROFILE_PHOTO_DIRECTORY_NAME: 'profile-photo',
  storePhotoFile: jest.fn(),
  deleteStoredFiles: jest.fn(),
  listStoredPhotoPaths: jest.fn(),
  resolveStoredImage: jest.fn(),
  deleteAllStoredPhotos: jest.fn(),
}));

const storePhotoFileMock = jest.mocked(storePhotoFile);
const deleteStoredFilesMock = jest.mocked(deleteStoredFiles);
const listStoredPhotoPathsMock = jest.mocked(listStoredPhotoPaths);

const baseProfile: Profile = { name: 'Ana', startDate: '2026-09-07', createdAt: '2026-09-07T10:00:00.000Z' };

async function readSavedProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  return raw ? parseProfile(JSON.parse(raw)) : null;
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  storePhotoFileMock.mockImplementation(async (_uri, fileName, directoryName) => `${directoryName}/${fileName}`);
});

describe('parseProfile', () => {
  it('mantém o caminho da foto de perfil quando é um texto válido', () => {
    expect(parseProfile({ ...baseProfile, avatarPath: 'profile-photo/avatar-1.jpg' })).toEqual({
      ...baseProfile,
      avatarPath: 'profile-photo/avatar-1.jpg',
    });
  });

  it('ignora uma foto inválida sem descartar o perfil', () => {
    expect(parseProfile({ ...baseProfile, avatarPath: 42 })).toEqual(baseProfile);
    expect(parseProfile({ ...baseProfile, avatarPath: '  ' })).toEqual(baseProfile);
  });

  it('perfis antigos (sem foto) continuam válidos', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(baseProfile));
    expect(await profileStorage.getOrCreate()).toEqual(baseProfile);
  });
});

describe('saveProfilePhoto', () => {
  it('copia a foto para a pasta do perfil e grava só o caminho relativo no AsyncStorage', async () => {
    const next = await saveProfilePhoto(baseProfile, 'file:///cache/ImagePicker/abc.png');

    expect(storePhotoFileMock).toHaveBeenCalledWith(
      'file:///cache/ImagePicker/abc.png',
      expect.stringMatching(/^avatar-[a-z0-9]+\.png$/),
      'profile-photo',
    );
    expect(next.avatarPath).toMatch(/^profile-photo\/avatar-[a-z0-9]+\.png$/);
    expect(next).toMatchObject(baseProfile);
    expect(await readSavedProfile()).toEqual(next);
    expect(deleteStoredFilesMock).not.toHaveBeenCalled();
  });

  it('ao trocar a foto, apaga o arquivo anterior só depois de gravar o perfil', async () => {
    const previous = { ...baseProfile, avatarPath: 'profile-photo/avatar-old.jpg' };
    const next = await saveProfilePhoto(previous, 'file:///cache/new.jpg');

    expect(await readSavedProfile()).toEqual(next);
    expect(deleteStoredFilesMock).toHaveBeenCalledWith(['profile-photo/avatar-old.jpg']);
  });

  it('se o perfil não puder ser gravado, remove o arquivo novo e mantém a foto anterior', async () => {
    const previous = { ...baseProfile, avatarPath: 'profile-photo/avatar-old.jpg' };
    jest.spyOn(profileStorage, 'save').mockRejectedValueOnce(new Error('disco cheio'));

    await expect(saveProfilePhoto(previous, 'file:///cache/new.jpg')).rejects.toThrow('disco cheio');

    const created = storePhotoFileMock.mock.results[0];
    expect(created.type).toBe('return');
    const newPath = await created.value;
    expect(deleteStoredFilesMock).toHaveBeenCalledTimes(1);
    expect(deleteStoredFilesMock).toHaveBeenCalledWith([newPath]);
    expect(deleteStoredFilesMock).not.toHaveBeenCalledWith(['profile-photo/avatar-old.jpg']);
  });

  it('se a cópia do arquivo falhar, nada é gravado nem apagado', async () => {
    storePhotoFileMock.mockRejectedValueOnce(new Error('sem espaço'));

    await expect(saveProfilePhoto(baseProfile, 'file:///cache/new.jpg')).rejects.toThrow('sem espaço');
    expect(await readSavedProfile()).toBeNull();
    expect(deleteStoredFilesMock).not.toHaveBeenCalled();
  });
});

describe('removeProfilePhoto', () => {
  it('volta ao avatar padrão e apaga o arquivo', async () => {
    const withPhoto = { ...baseProfile, avatarPath: 'profile-photo/avatar-1.jpg' };
    const next = await removeProfilePhoto(withPhoto);

    expect(next).toEqual(baseProfile);
    expect(await readSavedProfile()).toEqual(baseProfile);
    expect(deleteStoredFilesMock).toHaveBeenCalledWith(['profile-photo/avatar-1.jpg']);
  });

  it('não faz nada quando não há foto', async () => {
    expect(await removeProfilePhoto(baseProfile)).toBe(baseProfile);
    expect(await readSavedProfile()).toBeNull();
    expect(deleteStoredFilesMock).not.toHaveBeenCalled();
  });
});

describe('limpeza de fotos de perfil antigas', () => {
  it('considera órfã toda foto diferente da atual', () => {
    const stored = ['profile-photo/a.jpg', 'profile-photo/b.jpg'];
    expect(findOrphanProfilePhotos(stored, 'profile-photo/b.jpg')).toEqual(['profile-photo/a.jpg']);
    expect(findOrphanProfilePhotos(stored, undefined)).toEqual(stored);
  });

  it('apaga as sobras da pasta do perfil e preserva a foto atual', () => {
    listStoredPhotoPathsMock.mockReturnValueOnce(['profile-photo/a.jpg', 'profile-photo/b.jpg']);

    expect(cleanupOrphanProfilePhotos('profile-photo/b.jpg')).toBe(1);
    expect(listStoredPhotoPathsMock).toHaveBeenCalledWith('profile-photo');
    expect(deleteStoredFilesMock).toHaveBeenCalledWith(['profile-photo/a.jpg']);
  });

  it('uma falha na limpeza nunca interrompe o app', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    listStoredPhotoPathsMock.mockImplementationOnce(() => {
      throw new Error('erro de leitura');
    });

    expect(cleanupOrphanProfilePhotos(undefined)).toBe(0);
    expect(deleteStoredFilesMock).not.toHaveBeenCalled();
  });
});

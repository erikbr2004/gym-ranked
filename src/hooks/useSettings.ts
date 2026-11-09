import { useAppData } from '../contexts/AppDataContext';

/** Preferências do usuário, persistidas no AsyncStorage. */
export function useSettings() {
  const { settings, updateSettings } = useAppData();
  return { settings, updateSettings };
}

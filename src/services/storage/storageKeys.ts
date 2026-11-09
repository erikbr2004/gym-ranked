export const STORAGE_KEYS = {
  PROFILE: '@gym-ranked/profile',
  SETTINGS: '@gym-ranked/settings',
  /**
   * Treinos da primeira etapa. Desde a segunda etapa os treinos ficam no SQLite;
   * esta chave só é lida pela migração e apagada depois de confirmada.
   */
  LEGACY_WORKOUTS: '@gym-ranked/workouts',
} as const;

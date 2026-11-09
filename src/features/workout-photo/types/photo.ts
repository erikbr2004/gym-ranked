import type { MuscleGroup } from '../../../constants/muscleGroups';
import type { RankName } from '../../../constants/rankingConfig';
import type { DateKey } from '../../../types/common';

/**
 * Metadados da foto de um treino (tabela `workout_photos` do SQLite).
 * Os caminhos são relativos ao diretório de documentos do app: o caminho
 * absoluto desse diretório pode mudar entre atualizações no iOS.
 */
export type WorkoutPhoto = {
  id: string;
  workoutId: string;
  /** Foto original, como saiu da câmera ou da galeria. */
  originalImagePath: string;
  /** Composição final com as informações do treino incorporadas à imagem. */
  generatedImagePath: string;
  createdAt: string;
};

/** Arquivo de imagem resolvido para exibição. */
export type StoredImage = {
  uri: string;
  exists: boolean;
};

/** Resultado de um grupo muscular trabalhado, exibido na composição. */
export type PhotoMuscleGroupResult = {
  muscleGroup: MuscleGroup;
  label: string;
  rank: RankName;
  /** Pontos que o treino realmente gerou para o grupo; `null` quando não houve alteração. */
  pointsEarned: number | null;
};

/** Dados reais do treino que vão para a imagem. Nada aqui é inventado. */
export type WorkoutPhotoData = {
  title: string;
  date: DateKey;
  durationMinutes?: number;
  groups: PhotoMuscleGroupResult[];
};

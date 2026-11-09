import type { MuscleGroup } from '../../../constants/muscleGroups';

/*
 * Mapeamentos entre a API wger e o GymRank. Ids conferidos nos endpoints
 * /language, /exercisecategory, /muscle e /equipment da API v2.
 */

export const WGER_LANGUAGE_ID = {
  portuguese: 7,
  english: 2,
} as const;

/**
 * Filtros de `/exerciseinfo/` para cada grupo do GymRank. A wger não tem as
 * categorias Bíceps e Tríceps: elas são a categoria Braços (8) filtrada pelo
 * músculo principal (1 = bíceps braquial, 5 = tríceps braquial). Pernas inclui
 * Panturrilhas (14).
 */
export const MUSCLE_GROUP_API_FILTERS: Record<MuscleGroup, Record<string, string>> = {
  chest: { category: '11' },
  back: { category: '12' },
  shoulders: { category: '13' },
  biceps: { category: '8', muscles: '1' },
  triceps: { category: '8', muscles: '5' },
  legs: { category__in: '9,14' },
  abs: { category: '10' },
};

export const CATEGORY_LABELS: Record<number, string> = {
  8: 'Braços',
  9: 'Pernas',
  10: 'Abdômen',
  11: 'Peito',
  12: 'Costas',
  13: 'Ombros',
  14: 'Panturrilhas',
  15: 'Cardio',
};

export const MUSCLE_LABELS: Record<number, string> = {
  1: 'Bíceps',
  2: 'Deltoide anterior',
  3: 'Serrátil anterior',
  4: 'Peitoral maior',
  5: 'Tríceps',
  6: 'Reto abdominal',
  7: 'Gastrocnêmio',
  8: 'Glúteo máximo',
  9: 'Trapézio',
  10: 'Quadríceps',
  11: 'Posterior de coxa',
  12: 'Latíssimo do dorso',
  13: 'Braquial',
  14: 'Oblíquo externo',
  15: 'Sóleo',
};

export const EQUIPMENT_LABELS: Record<number, string> = {
  1: 'Barra',
  2: 'Barra W',
  3: 'Halteres',
  4: 'Colchonete',
  5: 'Bola suíça',
  6: 'Barra fixa',
  7: 'Peso corporal',
  8: 'Banco',
  9: 'Banco inclinado',
  10: 'Kettlebell',
  11: 'Elástico',
  12: 'Polia',
};

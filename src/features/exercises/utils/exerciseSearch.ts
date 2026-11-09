import { normalizeForSearch } from '../../../utils/text';
import type { Exercise } from '../types/exercise';

/** Filtra por nome em português, nome em inglês ou apelidos, ignorando acentos. */
export function filterExercises(exercises: readonly Exercise[], query: string): Exercise[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [...exercises];

  return exercises.filter((exercise) =>
    [exercise.name, exercise.englishName ?? '', ...exercise.aliases].some((text) =>
      normalizeForSearch(text).includes(normalizedQuery),
    ),
  );
}

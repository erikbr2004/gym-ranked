import type { MuscleGroup } from '../../constants/muscleGroups';
import {
  CATEGORY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_GROUP_API_FILTERS,
  MUSCLE_LABELS,
  WGER_LANGUAGE_ID,
} from '../../features/exercises/constants/wgerCatalog';
import type { Exercise, ExercisePage } from '../../features/exercises/types/exercise';
import { asArray, isNonEmptyString, isRecord } from '../../utils/guards';
import { htmlToPlainText } from '../../utils/text';
import { ApiError, apiClient, toApiError } from './apiClient';

/*
 * Catálogo de exercícios da API wger.
 * Endpoint: GET /exerciseinfo/?category=<id>&limit=<n>&offset=<n>
 * Resposta JSON paginada: { count, next, previous, results: [...] }, em que cada
 * resultado traz categoria, músculos, equipamentos, imagens e as traduções.
 * O JSON é validado campo a campo; nada de `any` sai deste módulo.
 */

export const EXERCISE_PAGE_SIZE = 20;

type Translation = Record<string, unknown> & { name: string };

function labelById(value: unknown, labels: Record<number, string>, fallbackKeys: string[]): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.id === 'number' && labels[value.id]) return labels[value.id];
  const fallback = fallbackKeys.map((key) => value[key]).find(isNonEmptyString);
  return fallback ? fallback.trim() : null;
}

function uniqueLabels(values: unknown[], labels: Record<number, string>, fallbackKeys: string[]): string[] {
  const result = values
    .map((value) => labelById(value, labels, fallbackKeys))
    .filter((label): label is string => label !== null);
  return [...new Set(result)];
}

function findTranslation(translations: Record<string, unknown>[], languageId: number): Translation | undefined {
  return translations.find(
    (translation): translation is Translation =>
      translation.language === languageId && isNonEmptyString(translation.name),
  );
}

function aliasesOf(translation: Translation | undefined): string[] {
  if (!translation) return [];
  return asArray(translation.aliases)
    .map((alias) => (isRecord(alias) ? alias.alias : null))
    .filter(isNonEmptyString);
}

function pickImageUrl(images: unknown[]): string | null {
  const validImages = images.filter(isRecord);
  const image = validImages.find((item) => item.is_main === true) ?? validImages[0];
  if (!image) return null;

  const small = isRecord(image.thumbnails) ? image.thumbnails.small : null;
  if (isNonEmptyString(small)) return small;
  return isNonEmptyString(image.image) ? image.image : null;
}

/** Converte um item de `/exerciseinfo/`; itens sem nome utilizável são descartados. */
export function parseExerciseInfo(value: unknown): Exercise | null {
  if (!isRecord(value) || typeof value.id !== 'number') return null;

  const translations = asArray(value.translations).filter(isRecord);
  const portuguese = findTranslation(translations, WGER_LANGUAGE_ID.portuguese);
  const english = findTranslation(translations, WGER_LANGUAGE_ID.english);
  const main =
    portuguese ??
    english ??
    translations.find((translation): translation is Translation => isNonEmptyString(translation.name));
  if (!main) return null;

  const descriptionSource = [portuguese, english].find(
    (translation) => translation !== undefined && isNonEmptyString(translation.description),
  );
  const description = descriptionSource ? htmlToPlainText(String(descriptionSource.description)) : '';

  return {
    id: value.id,
    name: main.name.trim(),
    englishName: english && english !== main ? english.name.trim() : null,
    aliases: [...new Set([...aliasesOf(portuguese), ...aliasesOf(english)])],
    category: labelById(value.category, CATEGORY_LABELS, ['name']),
    muscles: uniqueLabels(asArray(value.muscles), MUSCLE_LABELS, ['name_en', 'name']),
    secondaryMuscles: uniqueLabels(asArray(value.muscles_secondary), MUSCLE_LABELS, ['name_en', 'name']),
    equipment: uniqueLabels(asArray(value.equipment), EQUIPMENT_LABELS, ['name']),
    description: description || null,
    imageUrl: pickImageUrl(asArray(value.images)),
  };
}

/** Valida a página paginada; formatos inesperados viram `ApiError('invalid-response')`. */
export function parseExerciseInfoPage(json: unknown, offset: number): ExercisePage {
  if (!isRecord(json) || typeof json.count !== 'number' || !Array.isArray(json.results)) {
    throw new ApiError('invalid-response');
  }

  const items = json.results.map(parseExerciseInfo).filter((exercise): exercise is Exercise => exercise !== null);
  const consumed = offset + json.results.length;
  const hasNext = isNonEmptyString(json.next) && consumed < json.count && json.results.length > 0;

  return { items, total: json.count, nextOffset: hasNext ? consumed : null };
}

/** Parâmetros de consulta de cada grupo do GymRank (URL nunca fica nos componentes). */
export function buildExerciseQuery(group: MuscleGroup, offset: number, limit: number): Record<string, string | number> {
  return { ...MUSCLE_GROUP_API_FILTERS[group], limit, offset };
}

type FetchExercisePageParams = {
  group: MuscleGroup;
  offset: number;
  limit?: number;
  signal?: AbortSignal;
};

export async function fetchExercisePage({
  group,
  offset,
  limit = EXERCISE_PAGE_SIZE,
  signal,
}: FetchExercisePageParams): Promise<ExercisePage> {
  try {
    const response = await apiClient.get<unknown>('exerciseinfo/', {
      params: buildExerciseQuery(group, offset, limit),
      signal,
    });
    return parseExerciseInfoPage(response.data, offset);
  } catch (error) {
    throw toApiError(error);
  }
}

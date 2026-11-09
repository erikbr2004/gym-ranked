import { AxiosError, AxiosHeaders, CanceledError } from 'axios';

import { normalizeForSearch } from '../../../utils/text';
import { ApiError, toApiError } from '../apiClient';
import { buildExerciseQuery, parseExerciseInfo, parseExerciseInfoPage } from '../exerciseApi';

/** Amostra com a mesma estrutura do JSON real de GET /api/v2/exerciseinfo/?category=11 (campos reduzidos). */
const PAGE_FIXTURE = {
  count: 87,
  next: 'https://wger.de/api/v2/exerciseinfo/?category=11&limit=2&offset=2',
  previous: null,
  results: [
    {
      id: 73,
      uuid: 'c7a8f3e4-0000-0000-0000-000000000073',
      category: { id: 11, name: 'Chest' },
      muscles: [
        { id: 4, name: 'Pectoralis major', name_en: 'Chest', is_front: true },
        { id: 2, name: 'Anterior deltoid', name_en: 'Shoulders', is_front: true },
      ],
      muscles_secondary: [{ id: 5, name: 'Triceps brachii', name_en: 'Triceps', is_front: false }],
      equipment: [
        { id: 1, name: 'Barbell' },
        { id: 8, name: 'Bench' },
      ],
      images: [
        {
          id: 68,
          image: 'https://wger.de/media/exercise-images/192/Bench-press-1.png',
          thumbnails: { small: 'https://wger.de/media/exercise-images/192/Bench-press-1.png.200x200_q85.png' },
          is_main: true,
        },
      ],
      translations: [
        {
          id: 1,
          name: 'Bench Press',
          exercise: 73,
          language: 2,
          description: '<p>Lie down on a flat bench&nbsp;with the bar.</p>',
          aliases: [{ id: 1, alias: 'Flat bench press' }],
        },
        {
          id: 2,
          name: 'Supino reto',
          exercise: 73,
          language: 7,
          description: '<ul><li>Deite no banco.</li><li>Desça a barra até o peito.</li></ul>',
          aliases: [],
        },
        { id: 3, name: 'Bankdrücken', exercise: 73, language: 1, description: '', aliases: [] },
      ],
    },
    {
      id: 445,
      category: { id: 11, name: 'Chest' },
      muscles: [{ id: 99, name: 'Musculus novus', name_en: 'New muscle' }],
      muscles_secondary: [],
      equipment: [{ id: 42, name: 'Sled' }],
      images: [],
      translations: [{ id: 4, name: 'Pause Bench', exercise: 445, language: 2, description: '', aliases: [] }],
    },
  ],
};

describe('parseExerciseInfoPage', () => {
  it('converte o JSON paginado da API para o modelo do app', () => {
    const page = parseExerciseInfoPage(PAGE_FIXTURE, 0);

    expect(page.total).toBe(87);
    expect(page.nextOffset).toBe(2);
    expect(page.items[0]).toEqual({
      id: 73,
      name: 'Supino reto',
      englishName: 'Bench Press',
      aliases: ['Flat bench press'],
      category: 'Peito',
      muscles: ['Peitoral maior', 'Deltoide anterior'],
      secondaryMuscles: ['Tríceps'],
      equipment: ['Barra', 'Banco'],
      description: '• Deite no banco.\n• Desça a barra até o peito.',
      imageUrl: 'https://wger.de/media/exercise-images/192/Bench-press-1.png.200x200_q85.png',
    });
  });

  it('usa o inglês quando não há tradução em português e textos da API para ids desconhecidos', () => {
    const exercise = parseExerciseInfoPage(PAGE_FIXTURE, 0).items[1];

    expect(exercise.name).toBe('Pause Bench');
    expect(exercise.englishName).toBeNull();
    expect(exercise.muscles).toEqual(['New muscle']);
    expect(exercise.equipment).toEqual(['Sled']);
    expect(exercise.description).toBeNull();
    expect(exercise.imageUrl).toBeNull();
  });

  it('indica o fim da paginação', () => {
    const lastPage = { ...PAGE_FIXTURE, count: 2, next: null };
    expect(parseExerciseInfoPage(lastPage, 0).nextOffset).toBeNull();
  });

  it('lista vazia é uma resposta válida', () => {
    expect(parseExerciseInfoPage({ count: 0, next: null, previous: null, results: [] }, 0)).toEqual({
      items: [],
      total: 0,
      nextOffset: null,
    });
  });

  it('JSON inesperado vira ApiError("invalid-response")', () => {
    for (const invalid of [null, '<html>erro</html>', { results: 'x' }, { count: 1 }]) {
      expect(() => parseExerciseInfoPage(invalid, 0)).toThrow(ApiError);
    }
    try {
      parseExerciseInfoPage({ detail: 'Not found.' }, 0);
    } catch (error) {
      expect((error as ApiError).kind).toBe('invalid-response');
    }
  });

  it('descarta itens sem id ou sem nenhum nome', () => {
    expect(parseExerciseInfo({ id: 'abc' })).toBeNull();
    expect(parseExerciseInfo({ id: 1, translations: [{ language: 2, name: '  ' }] })).toBeNull();
  });
});

describe('buildExerciseQuery', () => {
  it('mapeia os grupos do GymRank para os filtros da wger', () => {
    expect(buildExerciseQuery('chest', 0, 20)).toEqual({ category: '11', limit: 20, offset: 0 });
    expect(buildExerciseQuery('biceps', 20, 20)).toEqual({ category: '8', muscles: '1', limit: 20, offset: 20 });
    expect(buildExerciseQuery('legs', 0, 50)).toEqual({ category__in: '9,14', limit: 50, offset: 0 });
  });
});

describe('toApiError', () => {
  it('classifica tempo limite, falta de rede, erro HTTP e cancelamento', () => {
    expect(toApiError(new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED')).kind).toBe('timeout');
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe('offline');

    const serverError = new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 503,
      statusText: 'Service Unavailable',
      data: null,
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    expect(toApiError(serverError)).toMatchObject({ kind: 'server', status: 503 });

    expect(toApiError(new CanceledError()).kind).toBe('canceled');
    expect(toApiError(new Error('?')).kind).toBe('unknown');
  });

  it('gera mensagens prontas para a interface', () => {
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK')).message).toMatch(/internet/);
  });
});

describe('normalizeForSearch', () => {
  it('ignora acentos, maiúsculas e espaços nas pontas', () => {
    expect(normalizeForSearch('  Supíno RETO ')).toBe('supino reto');
    expect(normalizeForSearch('Tríceps')).toBe('triceps');
  });
});

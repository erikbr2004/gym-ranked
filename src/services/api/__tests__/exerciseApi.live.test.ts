import type { AxiosStatic } from 'axios';

import { apiClient } from '../apiClient';
import { fetchExercisePage } from '../exerciseApi';

/*
 * Consulta REAL à API wger, executada somente sob demanda (precisa de internet):
 *   npm run test:api
 * Fica fora da suíte padrão para que os testes não dependam da rede.
 */

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const describeLive = env?.LIVE_API === '1' ? describe : describe.skip;

describeLive('API wger (requisição real)', () => {
  beforeAll(() => {
    // No Jest o `fetch` global é simulado; o adaptador HTTP do Axios para Node faz a
    // requisição de verdade. No app, o Axios usa o XHR do React Native.
    const nodeAxios = jest.requireActual<AxiosStatic>('axios/dist/node/axios.cjs');
    apiClient.defaults.adapter = nodeAxios.getAdapter('http');
  });

  it('busca exercícios de peito, com JSON válido e paginação', async () => {
    const page = await fetchExercisePage({ group: 'chest', offset: 0 });

    expect(page.total).toBeGreaterThan(0);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.nextOffset).toBe(20);
    for (const exercise of page.items) {
      expect(typeof exercise.id).toBe('number');
      expect(exercise.name.length).toBeGreaterThan(0);
    }
    console.log(
      `[API real] ${page.total} exercícios de peito; exemplos: ${page.items
        .slice(0, 5)
        .map((exercise) => exercise.name)
        .join(', ')}`,
    );
  }, 30000);

  it('filtra bíceps pela categoria Braços + músculo bíceps', async () => {
    const page = await fetchExercisePage({ group: 'biceps', offset: 0, limit: 5 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((exercise) => exercise.muscles.includes('Bíceps'))).toBe(true);
  }, 30000);
});

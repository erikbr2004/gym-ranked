import { useCallback, useEffect, useState } from 'react';

import type { MuscleGroup } from '../../../constants/muscleGroups';
import { ApiError, toApiError } from '../../../services/api/apiClient';
import { EXERCISE_PAGE_SIZE, fetchExercisePage } from '../../../services/api/exerciseApi';
import type { Exercise } from '../types/exercise';

/** Páginas maiores quando a busca precisa percorrer o grupo inteiro. */
const SEARCH_PAGE_SIZE = 50;

type CatalogState = {
  /** Grupo ao qual os itens abaixo pertencem. */
  group: MuscleGroup;
  status: 'loading' | 'ready' | 'error';
  items: Exercise[];
  total: number | null;
  nextOffset: number | null;
  error: ApiError | null;
  isLoadingMore: boolean;
  loadMoreError: ApiError | null;
};

function createLoadingState(group: MuscleGroup): CatalogState {
  return {
    group,
    status: 'loading',
    items: [],
    total: null,
    nextOffset: null,
    error: null,
    isLoadingMore: false,
    loadMoreError: null,
  };
}

function mergeUnique(current: Exercise[], incoming: Exercise[]): Exercise[] {
  const seen = new Set(current.map((exercise) => exercise.id));
  return [...current, ...incoming.filter((exercise) => !seen.has(exercise.id))];
}

/**
 * Estado do catálogo de um grupo muscular: primeira página, paginação, erros e
 * nova tentativa. Com `loadAll` (busca ativa), as páginas restantes do grupo são
 * buscadas para que a pesquisa considere todos os exercícios, não só os visíveis.
 */
export function useExerciseCatalog(group: MuscleGroup, loadAll: boolean) {
  const [state, setState] = useState<CatalogState>(() => createLoadingState(group));
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchExercisePage({ group, offset: 0, signal: controller.signal })
      .then((page) => {
        setState({
          ...createLoadingState(group),
          status: 'ready',
          items: page.items,
          total: page.total,
          nextOffset: page.nextOffset,
        });
      })
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.kind === 'canceled') return;
        setState({ ...createLoadingState(group), status: 'error', error: apiError });
      });
    // Trocar de grupo cancela a requisição anterior para não misturar resultados.
    return () => controller.abort();
  }, [group, reloadToken]);

  // Enquanto a primeira página do novo grupo não chega, a tela mostra o carregamento.
  const current = state.group === group ? state : createLoadingState(group);

  const loadMore = useCallback(async () => {
    const offset = current.nextOffset;
    if (current.status !== 'ready' || offset === null || current.isLoadingMore) return;

    setState((previous) => ({ ...previous, isLoadingMore: true, loadMoreError: null }));
    try {
      const page = await fetchExercisePage({
        group,
        offset,
        limit: loadAll ? SEARCH_PAGE_SIZE : EXERCISE_PAGE_SIZE,
      });
      setState((previous) =>
        previous.group !== group || previous.nextOffset !== offset
          ? previous
          : {
              ...previous,
              items: mergeUnique(previous.items, page.items),
              total: page.total,
              nextOffset: page.nextOffset,
              isLoadingMore: false,
            },
      );
    } catch (error) {
      const apiError = toApiError(error);
      setState((previous) =>
        previous.group !== group ? previous : { ...previous, isLoadingMore: false, loadMoreError: apiError },
      );
    }
  }, [current.status, current.nextOffset, current.isLoadingMore, group, loadAll]);

  const canAutoLoad = loadAll && current.status === 'ready' && current.nextOffset !== null && !current.isLoadingMore;
  const hasLoadMoreError = current.loadMoreError !== null;

  useEffect(() => {
    if (!canAutoLoad || hasLoadMoreError) return undefined;
    // Pequeno intervalo entre páginas: evita rajadas de requisições enquanto o usuário digita.
    const timer = setTimeout(loadMore, 150);
    return () => clearTimeout(timer);
  }, [canAutoLoad, hasLoadMoreError, loadMore]);

  /** Refaz a primeira página após uma falha (falhas de paginação usam `loadMore` de novo). */
  const retry = useCallback(() => {
    setState(createLoadingState(group));
    setReloadToken((token) => token + 1);
  }, [group]);

  return {
    status: current.status,
    items: current.items,
    total: current.total,
    hasMore: current.nextOffset !== null,
    error: current.error,
    isLoadingMore: current.isLoadingMore,
    loadMoreError: current.loadMoreError,
    loadMore,
    retry,
  };
}

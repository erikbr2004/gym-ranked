import { create, isAxiosError, isCancel } from 'axios';

/** API pública e somente leitura do projeto wger: não exige chave de acesso. */
export const WGER_API_BASE_URL = 'https://wger.de/api/v2/';
export const API_TIMEOUT_MS = 15000;

/** Cliente HTTP único do app: URL base, tempo limite e formato JSON centralizados. */
export const apiClient = create({
  baseURL: WGER_API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

export type ApiErrorKind = 'offline' | 'timeout' | 'server' | 'invalid-response' | 'canceled' | 'unknown';

const API_ERROR_MESSAGES: Record<ApiErrorKind, string> = {
  offline: 'Sem conexão com a internet ou servidor fora do ar. Verifique a rede e tente novamente.',
  timeout: 'O servidor demorou demais para responder. Tente novamente.',
  server: 'O serviço de exercícios está indisponível no momento.',
  'invalid-response': 'O serviço de exercícios respondeu em um formato inesperado.',
  canceled: 'A consulta foi cancelada.',
  unknown: 'Não foi possível carregar os exercícios.',
};

/** Falha de API com mensagem pronta para a interface. */
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(API_ERROR_MESSAGES[kind]);
    this.name = 'ApiError';
  }
}

/** Traduz qualquer falha (rede, tempo limite, HTTP, cancelamento) para um `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isCancel(error)) return new ApiError('canceled', undefined, error);
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return new ApiError('timeout', undefined, error);
    if (error.response) return new ApiError('server', error.response.status, error);
    return new ApiError('offline', undefined, error);
  }
  return new ApiError('unknown', undefined, error);
}

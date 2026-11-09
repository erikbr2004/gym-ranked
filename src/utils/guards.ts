/** Objeto simples (não nulo e não array), útil para validar JSON de origem externa. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Retorna o valor se for array; caso contrário, uma lista vazia. */
export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

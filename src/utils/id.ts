/**
 * Gera um identificador único local (timestamp + aleatório).
 * Suficiente para dados de um único aparelho; ao migrar para backend,
 * o servidor pode passar a ser a fonte dos IDs.
 */
export function generateId(): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${timePart}-${randomPart}`;
}

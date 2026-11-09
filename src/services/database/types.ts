/** Valores aceitos como parâmetros nas consultas SQL parametrizadas. */
export type SqlValue = string | number | null;

export type SqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

/**
 * Subconjunto da API do `SQLiteDatabase` (expo-sqlite) usado pelos repositórios.
 * Depender desta interface, e não da classe concreta, permite executar as mesmas
 * consultas contra o SQLite do Node nos testes automatizados.
 */
export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlValue[]): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/** Erro de banco com mensagem pronta para ser exibida ao usuário. */
export class DatabaseError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

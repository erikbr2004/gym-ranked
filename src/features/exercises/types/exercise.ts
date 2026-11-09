/** Exercício do catálogo já convertido do JSON da API wger para o modelo do app. */
export type Exercise = {
  id: number;
  /** Nome em português quando a API tem tradução; senão, em inglês. */
  name: string;
  /** Nome em inglês, exibido como apoio quando é diferente do principal. */
  englishName: string | null;
  aliases: string[];
  category: string | null;
  muscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  /** Descrição em texto simples (sem HTML), em português quando disponível. */
  description: string | null;
  imageUrl: string | null;
};

export type ExercisePage = {
  items: Exercise[];
  /** Total de exercícios do filtro no servidor. */
  total: number;
  /** Deslocamento da próxima página, ou `null` quando acabou. */
  nextOffset: number | null;
};

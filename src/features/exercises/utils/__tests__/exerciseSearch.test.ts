import type { Exercise } from '../../types/exercise';
import { filterExercises } from '../exerciseSearch';

function exercise(id: number, name: string, englishName: string | null, aliases: string[] = []): Exercise {
  return {
    id,
    name,
    englishName,
    aliases,
    category: 'Peito',
    muscles: [],
    secondaryMuscles: [],
    equipment: [],
    description: null,
    imageUrl: null,
  };
}

const CATALOG = [
  exercise(73, 'Supino reto', 'Bench Press', ['Flat bench press']),
  exercise(238, 'Crucifixo com halteres', 'Fly With Dumbbells'),
  exercise(386, 'Diamond push ups', null),
];

describe('filterExercises', () => {
  it('busca em português ignorando acentos e maiúsculas', () => {
    expect(filterExercises(CATALOG, 'SUPÍNO').map((item) => item.id)).toEqual([73]);
  });

  it('também encontra pelo nome em inglês e pelos apelidos', () => {
    expect(filterExercises(CATALOG, 'dumbbell').map((item) => item.id)).toEqual([238]);
    expect(filterExercises(CATALOG, 'flat bench').map((item) => item.id)).toEqual([73]);
  });

  it('busca vazia retorna tudo e termo sem correspondência retorna lista vazia', () => {
    expect(filterExercises(CATALOG, '   ')).toHaveLength(3);
    expect(filterExercises(CATALOG, 'agachamento')).toEqual([]);
  });
});

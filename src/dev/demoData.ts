import type { MuscleGroup } from '../constants/muscleGroups';
import type { Profile } from '../features/profile/types/profile';
import type { Workout } from '../features/workouts/types/workout';
import type { DateKey } from '../types/common';
import { addDays, addWeeks, compareDateKeys, getWeekStart } from '../utils/date';

/*
 * Dados de demonstração — usados SOMENTE pelo botão de desenvolvimento do Perfil
 * (visível apenas em modo __DEV__). Nunca são carregados automaticamente.
 *
 * Geram 16 semanas completas de histórico com cenários variados:
 * grupos consistentes (ranks altos), falhas pontuais e um rebaixamento em Pernas.
 */

const DEMO_WEEKS = 16;

type DemoSession = {
  title: string;
  weekdayOffset: number;
  muscleGroups: MuscleGroup[];
  durationMinutes: number;
  /** Decide se a sessão acontece na semana `week` (0 = mais antiga, DEMO_WEEKS = atual). */
  happensOn: (week: number) => boolean;
  notes?: string;
};

const DEMO_SESSIONS: DemoSession[] = [
  {
    title: 'Push',
    weekdayOffset: 0,
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    durationMinutes: 65,
    happensOn: (week) => week !== 5,
    notes: 'Supino, desenvolvimento e tríceps corda.',
  },
  {
    title: 'Pull',
    weekdayOffset: 2,
    muscleGroups: ['back', 'biceps'],
    durationMinutes: 60,
    happensOn: (week) => week !== 3 && week !== 9 && week < DEMO_WEEKS,
  },
  {
    title: 'Pernas',
    weekdayOffset: 4,
    muscleGroups: ['legs'],
    durationMinutes: 70,
    // Pernas param nas duas últimas semanas completas → rebaixamento.
    happensOn: (week) => week < DEMO_WEEKS - 2,
  },
  {
    title: 'Core',
    weekdayOffset: 5,
    muscleGroups: ['abs'],
    durationMinutes: 25,
    happensOn: (week) => week % 2 === 0 && week < DEMO_WEEKS,
  },
];

export function createDemoData(today: DateKey, now: Date = new Date()): { profile: Profile; workouts: Workout[] } {
  const firstWeekStart = addWeeks(getWeekStart(today), -DEMO_WEEKS);
  const workouts: Workout[] = [];

  for (let week = 0; week <= DEMO_WEEKS; week += 1) {
    const weekStart = addWeeks(firstWeekStart, week);
    for (const session of DEMO_SESSIONS) {
      const date = addDays(weekStart, session.weekdayOffset);
      if (!session.happensOn(week) || compareDateKeys(date, today) > 0) continue;

      workouts.push({
        id: `demo-${date}-${session.title.toLowerCase()}`,
        title: session.title,
        date,
        muscleGroups: session.muscleGroups,
        durationMinutes: session.durationMinutes,
        ...(session.notes ? { notes: session.notes } : {}),
        createdAt: `${date}T19:00:00.000Z`,
      });
    }
  }

  return {
    profile: { name: 'Atleta Demo', startDate: firstWeekStart, createdAt: now.toISOString() },
    workouts,
  };
}

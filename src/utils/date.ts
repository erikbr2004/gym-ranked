import type { DateKey, WeekKey } from '../types/common';

/*
 * Utilitários de data do app.
 *
 * Toda a aritmética é feita sobre `DateKey` (`YYYY-MM-DD`) convertida para UTC,
 * o que evita erros de horário de verão e de fuso. Apenas `getTodayKey` lê o
 * relógio local do aparelho. Semanas seguem a ISO 8601: começam na segunda-feira.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}

function buildDateKey(year: number, month: number, day: number): DateKey | null {
  const utc = new Date(Date.UTC(year, month - 1, day));
  const isSameDate =
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
  return isSameDate ? `${pad(year, 4)}-${pad(month)}-${pad(day)}` : null;
}

function toUtcMs(key: DateKey): number {
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match || !isValidDateKey(key)) {
    throw new Error(`Data inválida: "${key}"`);
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function fromUtcMs(ms: number): DateKey {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

// ---------------------------------------------------------------------------
// Criação e validação
// ---------------------------------------------------------------------------

/** Data local do aparelho como `DateKey`. */
export function getTodayKey(now: Date = new Date()): DateKey {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string') return false;
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return false;
  return buildDateKey(Number(match[1]), Number(match[2]), Number(match[3])) !== null;
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromUtcMs(toUtcMs(key) + days * MS_PER_DAY);
}

export function addWeeks(key: DateKey, weeks: number): DateKey {
  return addDays(key, weeks * DAYS_PER_WEEK);
}

/** Diferença em dias (`a - b`). */
export function diffInDays(a: DateKey, b: DateKey): number {
  return Math.round((toUtcMs(a) - toUtcMs(b)) / MS_PER_DAY);
}

/** Comparador compatível com `Array.sort` (ordem crescente). */
export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minDateKey(a: DateKey, b: DateKey): DateKey {
  return compareDateKeys(a, b) <= 0 ? a : b;
}

// ---------------------------------------------------------------------------
// Semanas
// ---------------------------------------------------------------------------

/** Dia da semana ISO: 1 = segunda ... 7 = domingo. */
export function getIsoWeekday(key: DateKey): number {
  const day = new Date(toUtcMs(key)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Segunda-feira da semana que contém a data. */
export function getWeekStart(key: DateKey): DateKey {
  return addDays(key, 1 - getIsoWeekday(key));
}

/** Domingo da semana que contém a data. */
export function getWeekEnd(key: DateKey): DateKey {
  return addDays(getWeekStart(key), DAYS_PER_WEEK - 1);
}

export function getWeekRange(key: DateKey): { start: DateKey; end: DateKey } {
  return { start: getWeekStart(key), end: getWeekEnd(key) };
}

/**
 * Chave ISO 8601 da semana (`YYYY-Www`). O ano ISO é o ano da quinta-feira
 * da semana, por isso datas do fim de dezembro podem pertencer à semana 1.
 */
export function getWeekKey(key: DateKey): WeekKey {
  const thursday = addDays(getWeekStart(key), 3);
  const isoYear = Number(thursday.slice(0, 4));
  const firstDayOfYear = `${pad(isoYear, 4)}-01-01`;
  const week = Math.floor(diffInDays(thursday, firstDayOfYear) / DAYS_PER_WEEK) + 1;
  return `${pad(isoYear, 4)}-W${pad(week)}`;
}

/** Número da semana (ex.: `40` para `2026-W40`). */
export function getWeekNumber(key: DateKey): number {
  return Number(getWeekKey(key).split('-W')[1]);
}

/** Comparador de chaves de semana (ordem crescente). */
export function compareWeekKeys(a: WeekKey, b: WeekKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isSameWeek(a: DateKey, b: DateKey): boolean {
  return getWeekStart(a) === getWeekStart(b);
}

/** Uma semana só está completa depois que seu domingo já passou. */
export function isWeekComplete(dateInWeek: DateKey, today: DateKey): boolean {
  return compareDateKeys(getWeekEnd(dateInWeek), today) < 0;
}

/**
 * Segundas-feiras de todas as semanas completas desde a semana de `from`
 * até a semana anterior a `today` (a semana atual nunca é incluída).
 */
export function getCompletedWeekStarts(from: DateKey, today: DateKey): DateKey[] {
  const currentWeekStart = getWeekStart(today);
  const weeks: DateKey[] = [];
  for (
    let weekStart = getWeekStart(from);
    compareDateKeys(weekStart, currentWeekStart) < 0;
    weekStart = addWeeks(weekStart, 1)
  ) {
    weeks.push(weekStart);
  }
  return weeks;
}

/** Quantidade de semanas de calendário entre duas datas, incluindo ambas. */
export function countWeeksInclusive(from: DateKey, to: DateKey): number {
  const weeks = diffInDays(getWeekStart(to), getWeekStart(from)) / DAYS_PER_WEEK;
  return Math.max(0, weeks + 1);
}

// ---------------------------------------------------------------------------
// Agrupamento
// ---------------------------------------------------------------------------

export type WeekGroup<T> = {
  weekStart: DateKey;
  weekKey: WeekKey;
  items: T[];
};

/**
 * Agrupa itens por semana, da semana mais recente para a mais antiga,
 * mantendo a ordem original dos itens dentro de cada semana.
 */
export function groupByWeek<T>(items: readonly T[], getDate: (item: T) => DateKey): WeekGroup<T>[] {
  const groups = new Map<DateKey, T[]>();
  for (const item of items) {
    const weekStart = getWeekStart(getDate(item));
    const group = groups.get(weekStart);
    if (group) {
      group.push(item);
    } else {
      groups.set(weekStart, [item]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compareDateKeys(b, a))
    .map(([weekStart, groupItems]) => ({
      weekStart,
      weekKey: getWeekKey(weekStart),
      items: groupItems,
    }));
}

// ---------------------------------------------------------------------------
// Formatação (pt-BR, sem depender de Intl para funcionar igual em qualquer engine)
// ---------------------------------------------------------------------------

/** `2026-09-28` → `28/09/2026` */
export function formatDate(key: DateKey): string {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

/** `2026-09-28` → `28/09` */
export function formatShortDate(key: DateKey): string {
  const [, month, day] = key.split('-');
  return `${day}/${month}`;
}

/** `2026-09-28` → `segunda-feira, 28 de setembro de 2026` */
export function formatLongDate(key: DateKey): string {
  const date = new Date(toUtcMs(key));
  const weekday = WEEKDAY_NAMES[date.getUTCDay()];
  const month = MONTH_NAMES[date.getUTCMonth()];
  return `${weekday}, ${date.getUTCDate()} de ${month} de ${date.getUTCFullYear()}`;
}

/** `2026-09-30` → `28/09 – 04/10` */
export function formatWeekRange(key: DateKey): string {
  const { start, end } = getWeekRange(key);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

/** Converte `DD/MM/AAAA` digitado pelo usuário em `DateKey`, ou `null` se inválido. */
export function parseDisplayDate(text: string): DateKey | null {
  const match = BR_DATE_PATTERN.exec(text.trim());
  if (!match) return null;
  return buildDateKey(Number(match[3]), Number(match[2]), Number(match[1]));
}

/** Converte um timestamp ISO completo em `DD/MM/AAAA` no horário local. */
export function formatIsoTimestamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : formatDate(getTodayKey(date));
}

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

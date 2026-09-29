import {
  addDays,
  countWeeksInclusive,
  formatDate,
  formatLongDate,
  formatWeekRange,
  getCompletedWeekStarts,
  getIsoWeekday,
  getWeekEnd,
  getWeekKey,
  getWeekStart,
  groupByWeek,
  isValidDateKey,
  isWeekComplete,
  parseDisplayDate,
} from '../date';

describe('validação e aritmética', () => {
  it('valida DateKey', () => {
    expect(isValidDateKey('2026-09-28')).toBe(true);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('28/09/2026')).toBe(false);
    expect(isValidDateKey(123)).toBe(false);
  });

  it('soma dias atravessando meses e anos', () => {
    expect(addDays('2026-09-28', 7)).toBe('2026-10-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('converte data digitada DD/MM/AAAA', () => {
    expect(parseDisplayDate('28/09/2026')).toBe('2026-09-28');
    expect(parseDisplayDate(' 1/2/2026 ')).toBe('2026-02-01');
    expect(parseDisplayDate('31/02/2026')).toBeNull();
    expect(parseDisplayDate('')).toBeNull();
    expect(parseDisplayDate('abc')).toBeNull();
  });
});

describe('semanas ISO', () => {
  it('semana começa na segunda e termina no domingo', () => {
    expect(getIsoWeekday('2026-09-28')).toBe(1);
    expect(getWeekStart('2026-10-04')).toBe('2026-09-28');
    expect(getWeekEnd('2026-09-28')).toBe('2026-10-04');
  });

  it('gera chave ISO consistente', () => {
    expect(getWeekKey('2026-09-28')).toBe('2026-W40');
    expect(getWeekKey('2026-10-04')).toBe('2026-W40');
    expect(getWeekKey('2026-01-01')).toBe('2026-W01');
    // 31/12/2024 pertence à semana 1 do ano ISO de 2025
    expect(getWeekKey('2024-12-31')).toBe('2025-W01');
    // 01/01/2027 (sexta) ainda pertence à semana 53 de 2026
    expect(getWeekKey('2027-01-01')).toBe('2026-W53');
  });

  it('só considera completas as semanas cujo domingo já passou', () => {
    expect(isWeekComplete('2026-09-28', '2026-10-04')).toBe(false);
    expect(isWeekComplete('2026-09-28', '2026-10-05')).toBe(true);
  });

  it('lista semanas completas sem incluir a semana atual', () => {
    expect(getCompletedWeekStarts('2026-09-30', '2026-10-01')).toEqual([]);
    expect(getCompletedWeekStarts('2026-09-16', '2026-10-01')).toEqual(['2026-09-14', '2026-09-21']);
  });

  it('conta semanas inclusivas', () => {
    expect(countWeeksInclusive('2026-09-28', '2026-09-28')).toBe(1);
    expect(countWeeksInclusive('2026-09-21', '2026-09-28')).toBe(2);
    // 20/09 é domingo da W38: W38, W39 e W40
    expect(countWeeksInclusive('2026-09-20', '2026-09-28')).toBe(3);
  });
});

describe('formatação e agrupamento', () => {
  it('formata datas em pt-BR', () => {
    expect(formatDate('2026-09-28')).toBe('28/09/2026');
    expect(formatLongDate('2026-09-28')).toBe('segunda-feira, 28 de setembro de 2026');
    expect(formatWeekRange('2026-09-30')).toBe('28/09 – 04/10');
  });

  it('agrupa por semana da mais recente para a mais antiga', () => {
    const items = [{ d: '2026-09-29' }, { d: '2026-09-22' }, { d: '2026-09-28' }];
    const groups = groupByWeek(items, (item) => item.d);
    expect(groups.map((group) => group.weekKey)).toEqual(['2026-W40', '2026-W39']);
    expect(groups[0].items).toHaveLength(2);
  });
});

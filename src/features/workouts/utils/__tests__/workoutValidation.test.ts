import { createEmptyFormValues, validateWorkoutForm, type WorkoutFormValues } from '../workoutValidation';

const TODAY = '2026-09-28';

function values(overrides: Partial<WorkoutFormValues>): WorkoutFormValues {
  return { ...createEmptyFormValues(TODAY), ...overrides };
}

describe('validateWorkoutForm', () => {
  it('exige título, grupo muscular e data', () => {
    const result = validateWorkoutForm(values({ dateText: '' }), TODAY);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(Object.keys(result.errors).sort()).toEqual(['date', 'muscleGroups', 'title']);
    }
  });

  it('rejeita data inválida, data futura e duração não positiva', () => {
    const invalidDate = validateWorkoutForm(values({ title: 'A', muscleGroups: ['chest'], dateText: '31/02/2026' }), TODAY);
    const futureDate = validateWorkoutForm(values({ title: 'A', muscleGroups: ['chest'], dateText: '29/09/2026' }), TODAY);
    const zeroDuration = validateWorkoutForm(values({ title: 'A', muscleGroups: ['chest'], durationText: '0' }), TODAY);
    expect(invalidDate.isValid).toBe(false);
    expect(futureDate.isValid).toBe(false);
    expect(zeroDuration.isValid).toBe(false);
  });

  it('gera o treino normalizado quando válido', () => {
    const result = validateWorkoutForm(
      values({ title: '  Push  ', muscleGroups: ['triceps', 'chest'], durationText: '65', notes: '  ' }),
      TODAY,
    );
    expect(result).toEqual({
      isValid: true,
      input: { title: 'Push', date: TODAY, muscleGroups: ['chest', 'triceps'], exercises: [], durationMinutes: 65 },
    });
  });

  it('mantém os exercícios escolhidos no catálogo', () => {
    const exercises = [{ exerciseId: 73, name: 'Supino reto', muscleGroup: 'chest' as const }];
    const result = validateWorkoutForm(values({ title: 'Push', muscleGroups: ['chest'], exercises }), TODAY);
    expect(result.isValid && result.input.exercises).toEqual(exercises);
  });
});

import { useCallback } from 'react';

import { useWorkouts } from '../../../hooks/useWorkouts';
import { confirmAction, getErrorMessage, showMessage } from '../../../utils/dialogs';
import type { Workout } from '../types/workout';

/** Confirmação + exclusão + feedback, compartilhados entre Histórico e Detalhes. */
export function useDeleteWorkout() {
  const { deleteWorkout } = useWorkouts();

  return useCallback(
    async (workout: Workout): Promise<boolean> => {
      const confirmed = await confirmAction({
        title: 'Excluir treino',
        message: `Excluir "${workout.title}"? O ranking será recalculado.`,
        confirmLabel: 'Excluir',
        destructive: true,
      });
      if (!confirmed) return false;

      try {
        await deleteWorkout(workout.id);
        showMessage('Treino excluído', 'Histórico e ranking foram atualizados.');
        return true;
      } catch (error) {
        showMessage('Erro ao excluir', getErrorMessage(error));
        return false;
      }
    },
    [deleteWorkout],
  );
}

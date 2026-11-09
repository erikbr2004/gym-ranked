import { useCallback } from 'react';

import { useWorkoutPhotos } from '../../../hooks/useWorkoutPhotos';
import { useWorkouts } from '../../../hooks/useWorkouts';
import { confirmAction, getErrorMessage, showMessage } from '../../../utils/dialogs';
import type { Workout } from '../types/workout';

/** Confirmação + exclusão + feedback, compartilhados entre Histórico e Detalhes. */
export function useDeleteWorkout() {
  const { deleteWorkout } = useWorkouts();
  const { getPhoto } = useWorkoutPhotos();

  return useCallback(
    async (workout: Workout): Promise<boolean> => {
      const photoNotice = getPhoto(workout.id) ? ' A foto vinculada também será apagada do aparelho.' : '';
      const confirmed = await confirmAction({
        title: 'Excluir treino',
        message: `Excluir "${workout.title}"? O ranking será recalculado.${photoNotice}`,
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
    [deleteWorkout, getPhoto],
  );
}

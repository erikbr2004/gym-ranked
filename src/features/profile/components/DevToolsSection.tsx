import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../constants/theme';
import { createDemoData } from '../../../dev/demoData';
import { useProfile } from '../../../hooks/useProfile';
import { getTodayKey } from '../../../utils/date';
import { confirmAction, getErrorMessage, showMessage } from '../../../utils/dialogs';

/**
 * Ferramentas de desenvolvimento/apresentação. Renderizado apenas quando `__DEV__`
 * é verdadeiro, então não aparece em builds de produção.
 */
export function DevToolsSection() {
  const { replaceAllData, resetAllData, totalWorkouts, totalPhotos } = useProfile();

  const runAfterConfirm = async (
    title: string,
    message: string,
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    const confirmed = await confirmAction({ title, message, confirmLabel: 'Continuar', destructive: true });
    if (!confirmed) return;
    try {
      await action();
      showMessage('Pronto', successMessage);
    } catch (error) {
      showMessage('Erro', getErrorMessage(error));
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ferramentas de desenvolvimento</Text>
      <Text style={styles.description}>
        Visível apenas em modo de desenvolvimento. Os dados de demonstração simulam 16 semanas de treinos.
      </Text>
      <View style={styles.storage}>
        <Text style={styles.storageLine}>SQLite: {totalWorkouts} treino(s) e {totalPhotos} foto(s) (metadados)</Text>
        <Text style={styles.storageLine}>Arquivos do app: imagens das fotos e foto de perfil</Text>
        <Text style={styles.storageLine}>AsyncStorage: perfil e preferências</Text>
      </View>
      <AppButton
        label="Carregar demonstração"
        variant="secondary"
        icon="flask-outline"
        onPress={() =>
          runAfterConfirm(
            'Carregar demonstração',
            'Seus treinos e fotos atuais serão substituídos por dados de exemplo.',
            () => replaceAllData(createDemoData(getTodayKey())),
            'Dados de demonstração carregados.',
          )
        }
      />
      <AppButton
        label="Apagar todos os dados"
        variant="danger"
        icon="trash-outline"
        onPress={() =>
          runAfterConfirm(
            'Apagar dados',
            'Todos os treinos, fotos, o perfil e as preferências serão apagados deste aparelho.',
            resetAllData,
            'Todos os dados foram apagados.',
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  description: {
    color: colors.textSubtle,
    fontSize: fontSize.sm,
  },
  storage: {
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  storageLine: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});

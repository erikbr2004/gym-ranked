import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { images } from '../../constants/images';
import { colors, fontSize, fontWeight, sizes, spacing } from '../../constants/theme';
import { AppButton } from '../AppButton';

type LoadingScreenProps = {
  /** Quando informado, mostra a mensagem de erro e o botão de tentar novamente. */
  errorMessage?: string;
  onRetry?: () => void;
};

export function LoadingScreen({ errorMessage, onRetry }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Image source={images.avatar} style={styles.logo} accessibilityIgnoresInvertColors />
      <Text style={styles.brand}>GymRank</Text>
      {errorMessage ? (
        <>
          <Text style={styles.error}>{errorMessage}</Text>
          {onRetry && <AppButton label="Tentar novamente" onPress={onRetry} icon="refresh" />}
        </>
      ) : (
        <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Carregando dados" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  logo: {
    width: sizes.avatarLg,
    height: sizes.avatarLg,
  },
  brand: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});

import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../../constants/theme';

type ScreenContainerProps = {
  children: ReactNode;
  /** Telas das abas precisam do topo; telas com header nativo não precisam de nenhuma borda. */
  edges?: Edge[];
};

export function ScreenContainer({ children, edges = ['top'] }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

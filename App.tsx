import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from './src/components/LoadingScreen';
import { AppDataProvider } from './src/contexts/AppDataContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppDataProvider
        loadingFallback={<LoadingScreen />}
        renderError={(message, retry) => <LoadingScreen errorMessage={message} onRetry={retry} />}
      >
        <AppNavigator />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

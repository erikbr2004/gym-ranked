import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/theme';
import { EditWorkoutScreen } from '../features/workouts/screens/EditWorkoutScreen';
import { WorkoutDetailsScreen } from '../features/workouts/screens/WorkoutDetailsScreen';
import { BottomTabs } from './BottomTabs';
import type { RootStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="WorkoutDetails"
          component={WorkoutDetailsScreen}
          options={{ title: 'Detalhes do treino' }}
        />
        <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} options={{ title: 'Editar treino' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

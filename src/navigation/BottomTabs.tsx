import type { ComponentProps } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, fontWeight } from '../constants/theme';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { HistoryScreen } from '../features/history/screens/HistoryScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { RankingScreen } from '../features/ranking/screens/RankingScreen';
import { NewWorkoutScreen } from '../features/workouts/screens/NewWorkoutScreen';
import type { MainTabParamList } from './navigationTypes';

type IconName = ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  NewWorkout: { active: 'add-circle', inactive: 'add-circle-outline' },
  Ranking: { active: 'trophy', inactive: 'trophy-outline' },
  History: { active: 'time', inactive: 'time-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="NewWorkout" component={NewWorkoutScreen} options={{ title: 'Novo Treino' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Histórico' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

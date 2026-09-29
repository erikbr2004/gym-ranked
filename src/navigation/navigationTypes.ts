import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MuscleGroup } from '../constants/muscleGroups';

export type MainTabParamList = {
  Home: undefined;
  /** `preselectedGroup` é enviado pelo Dashboard ao tocar em um grupo muscular. */
  NewWorkout: { preselectedGroup?: MuscleGroup } | undefined;
  Ranking: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  WorkoutDetails: { workoutId: string };
  EditWorkout: { workoutId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

// Tipagem global para `useNavigation()` sem precisar de genéricos em cada uso.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

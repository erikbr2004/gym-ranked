import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MuscleGroup } from '../constants/muscleGroups';
import type { WorkoutExercise } from '../features/workouts/types/workout';

export type MainTabParamList = {
  Home: undefined;
  NewWorkout:
    | {
        /** Enviado pelo Dashboard ao tocar em um grupo muscular. */
        preselectedGroup?: MuscleGroup;
        /** Devolvido pelo catálogo de exercícios ao confirmar a seleção. */
        pickedExercises?: WorkoutExercise[];
      }
    | undefined;
  Ranking: undefined;
  History: undefined;
  Profile: undefined;
};

/** Formulário que abriu o catálogo e deve receber os exercícios escolhidos. */
export type ExercisePickTarget = { screen: 'NewWorkout' } | { screen: 'EditWorkout'; workoutId: string };

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  WorkoutDetails: { workoutId: string };
  EditWorkout: { workoutId: string; pickedExercises?: WorkoutExercise[] };
  /** Resumo exibido logo após "Finalizar treino". */
  WorkoutCompleted: { workoutId: string };
  /** Personalização da foto; `storedOriginalPath` indica que a foto já é a original guardada no app. */
  WorkoutPhoto: {
    workoutId: string;
    photoUri: string;
    storedOriginalPath?: string;
    origin: 'completion' | 'details';
  };
  ExerciseCatalog:
    | { mode: 'browse'; initialGroup?: MuscleGroup }
    | { mode: 'select'; target: ExercisePickTarget; selected: WorkoutExercise[]; initialGroup?: MuscleGroup };
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

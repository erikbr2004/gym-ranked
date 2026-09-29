import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const MUSCLE_GROUP_IDS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'abs',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUP_IDS)[number];

type MuscleGroupDefinition = {
  label: string;
  icon: IconName;
};

/** Fonte única dos nomes e ícones dos grupos musculares. */
export const MUSCLE_GROUPS: Record<MuscleGroup, MuscleGroupDefinition> = {
  chest: { label: 'Peito', icon: 'weight-lifter' },
  back: { label: 'Costas', icon: 'rowing' },
  shoulders: { label: 'Ombros', icon: 'human-handsup' },
  biceps: { label: 'Bíceps', icon: 'arm-flex' },
  triceps: { label: 'Tríceps', icon: 'arm-flex-outline' },
  legs: { label: 'Pernas', icon: 'run-fast' },
  abs: { label: 'Abdômen', icon: 'human-male' },
};

export function getMuscleGroupLabel(group: MuscleGroup): string {
  return MUSCLE_GROUPS[group].label;
}

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === 'string' && (MUSCLE_GROUP_IDS as readonly string[]).includes(value);
}

/** Ordena grupos pela ordem canônica definida em MUSCLE_GROUP_IDS. */
export function sortMuscleGroups(groups: readonly MuscleGroup[]): MuscleGroup[] {
  return [...groups].sort((a, b) => MUSCLE_GROUP_IDS.indexOf(a) - MUSCLE_GROUP_IDS.indexOf(b));
}

import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '../../../components/AppButton';
import { EmptyState } from '../../../components/EmptyState';
import { MuscleGroupTag } from '../../../components/MuscleGroupTag';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { RootStackScreenProps } from '../../../navigation/navigationTypes';
import { formatIsoTimestamp, formatLongDate, formatWeekRange, getWeekNumber } from '../../../utils/date';
import { useDeleteWorkout } from '../hooks/useDeleteWorkout';

type InfoRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={sizes.iconMd} color={colors.primary} />
      <View style={styles.infoTexts}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function WorkoutDetailsScreen({ navigation, route }: RootStackScreenProps<'WorkoutDetails'>) {
  const { getWorkoutById } = useWorkouts();
  const confirmDelete = useDeleteWorkout();
  const workout = getWorkoutById(route.params.workoutId);

  if (!workout) {
    return (
      <ScreenContainer edges={[]}>
        <EmptyState icon="alert-circle-outline" title="Treino não encontrado" message="Ele pode ter sido excluído." />
      </ScreenContainer>
    );
  }

  const handleDelete = async () => {
    const deleted = await confirmDelete(workout);
    if (deleted) navigation.goBack();
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {workout.title}
        </Text>

        <View style={styles.card}>
          <InfoRow icon="calendar-outline" label="Data" value={formatLongDate(workout.date)} />
          <InfoRow
            icon="stats-chart-outline"
            label="Semana do ranking"
            value={`Semana ${getWeekNumber(workout.date)} · ${formatWeekRange(workout.date)}`}
          />
          {workout.durationMinutes !== undefined && (
            <InfoRow icon="time-outline" label="Duração" value={`${workout.durationMinutes} minutos`} />
          )}
          <InfoRow icon="create-outline" label="Registrado em" value={formatIsoTimestamp(workout.createdAt)} />
        </View>

        <Text style={styles.sectionTitle}>Grupos musculares</Text>
        <View style={styles.tags}>
          {workout.muscleGroups.map((group) => (
            <MuscleGroupTag key={group} muscleGroup={group} />
          ))}
        </View>

        {workout.notes ? (
          <>
            <Text style={styles.sectionTitle}>Observações</Text>
            <View style={styles.card}>
              <Text style={styles.notes}>{workout.notes}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            label="Editar treino"
            variant="secondary"
            icon="create-outline"
            onPress={() => navigation.navigate('EditWorkout', { workoutId: workout.id })}
          />
          <AppButton label="Excluir treino" variant="danger" icon="trash-outline" onPress={handleDelete} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.md,
    marginTop: spacing.xxs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notes: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});

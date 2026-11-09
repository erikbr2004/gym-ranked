import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '../../../components/AppButton';
import { EmptyState } from '../../../components/EmptyState';
import { RankBadge } from '../../../components/RankBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { getMuscleGroupLabel, MUSCLE_GROUPS } from '../../../constants/muscleGroups';
import { colors, fontSize, fontWeight, radius, sizes, spacing, withAlpha } from '../../../constants/theme';
import { useWorkoutContributions } from '../../../hooks/useWorkoutContributions';
import { useWorkouts } from '../../../hooks/useWorkouts';
import type { RootStackScreenProps } from '../../../navigation/navigationTypes';
import { formatLongDate, getWeekNumber, isSameWeek } from '../../../utils/date';
import type { PhotoSourceChoice } from '../../../utils/dialogs';
import type { WorkoutGroupContribution } from '../../ranking/types/ranking';
import { usePhotoPicker } from '../../workout-photo/hooks/usePhotoPicker';
import { WorkoutExerciseList } from '../components/WorkoutExerciseList';
import type { Workout } from '../types/workout';

/**
 * Resumo exibido logo após "Finalizar treino". O treino já está salvo: tirar a
 * foto é opcional e não altera pontos nem o histórico.
 */
export function WorkoutCompletedScreen({ navigation, route }: RootStackScreenProps<'WorkoutCompleted'>) {
  const { getWorkoutById, today } = useWorkouts();
  const workout = getWorkoutById(route.params.workoutId);
  const contributions = useWorkoutContributions(workout);
  const { pickPhoto, isPicking } = usePhotoPicker();

  if (!workout) {
    return (
      <ScreenContainer edges={['bottom']}>
        <EmptyState icon="alert-circle-outline" title="Treino não encontrado" message="Ele pode ter sido excluído." />
      </ScreenContainer>
    );
  }

  const startPhoto = async (source: PhotoSourceChoice) => {
    const photoUri = await pickPhoto(source);
    if (photoUri) {
      navigation.navigate('WorkoutPhoto', { workoutId: workout.id, photoUri, origin: 'completion' });
    }
  };

  const finishWithoutPhoto = () => navigation.popTo('MainTabs', { screen: 'History' });
  const weekLabel = isSameWeek(workout.date, today) ? 'nesta semana' : `na semana ${getWeekNumber(workout.date)}`;

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="checkmark" size={40} color={colors.onPrimary} />
          </View>
          <Text style={styles.heroTitle} accessibilityRole="header">
            Treino concluído!
          </Text>
          <Text style={styles.heroSubtitle}>Salvo no seu histórico</Text>
        </View>

        <WorkoutSummaryCard workout={workout} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resultado no ranking</Text>
          {contributions.map((contribution) => (
            <ContributionRow key={contribution.muscleGroup} contribution={contribution} weekLabel={weekLabel} />
          ))}
          <Text style={styles.footnote}>
            Cada grupo pontua uma vez por semana. Registrar a foto não gera pontos.
          </Text>
        </View>

        {workout.exercises.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Exercícios</Text>
            <WorkoutExerciseList exercises={workout.exercises} />
          </View>
        )}

        <View style={[styles.card, styles.photoCard]}>
          <MaterialCommunityIcons name="camera-iris" size={sizes.iconLg} color={colors.primary} />
          <Text style={styles.cardTitle}>Registre o momento</Text>
          <Text style={styles.photoText}>
            Tire uma foto e gere uma imagem com os dados reais deste treino, pronta para salvar e compartilhar.
          </Text>
          <View style={styles.actions}>
            <AppButton
              label="Tirar foto do treino"
              icon="camera-outline"
              onPress={() => startPhoto('camera')}
              loading={isPicking}
            />
            <AppButton
              label="Escolher da galeria"
              variant="secondary"
              icon="images-outline"
              onPress={() => startPhoto('library')}
              disabled={isPicking}
            />
          </View>
        </View>

        <AppButton label="Concluir sem foto" variant="secondary" icon="time-outline" onPress={finishWithoutPhoto} />
      </ScrollView>
    </ScreenContainer>
  );
}

function WorkoutSummaryCard({ workout }: { workout: Workout }) {
  const details = [
    formatLongDate(workout.date),
    workout.durationMinutes !== undefined ? `${workout.durationMinutes} min` : null,
    workout.exercises.length > 0 ? `${workout.exercises.length} exercício(s)` : null,
  ].filter((detail): detail is string => detail !== null);

  return (
    <View style={styles.card}>
      <Text style={styles.workoutTitle}>{workout.title}</Text>
      <Text style={styles.workoutDetails}>{details.join(' · ')}</Text>
      <Text style={styles.workoutGroups}>{workout.muscleGroups.map(getMuscleGroupLabel).join(' • ')}</Text>
    </View>
  );
}

function ContributionRow({ contribution, weekLabel }: { contribution: WorkoutGroupContribution; weekLabel: string }) {
  const { label, icon } = MUSCLE_GROUPS[contribution.muscleGroup];
  const earned = contribution.pointsEarned;

  return (
    <View style={styles.contributionRow}>
      <MaterialCommunityIcons name={icon} size={sizes.iconMd} color={colors.textMuted} />
      <View style={styles.contributionTexts}>
        <Text style={styles.contributionLabel}>{label}</Text>
        <RankBadge rank={contribution.rank} points={contribution.points} size="sm" />
      </View>
      {earned !== null ? (
        <View style={styles.pointsArea}>
          <Text style={styles.pointsEarned}>
            +{earned} pts {weekLabel}
          </Text>
          {contribution.streakBonus !== null && contribution.streakBonus > 0 && (
            <Text style={styles.streakBonus}>inclui +{contribution.streakBonus} de sequência</Text>
          )}
        </View>
      ) : (
        <Text style={styles.pointsNone}>Semana já contabilizada</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  workoutTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
  },
  workoutDetails: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: -spacing.sm,
  },
  workoutGroups: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  contributionTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  contributionLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  pointsArea: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
    maxWidth: 140,
  },
  pointsEarned: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    maxWidth: 120,
  },
  streakBonus: {
    color: colors.warning,
    fontSize: fontSize.xs,
    textAlign: 'right',
  },
  pointsNone: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
    textAlign: 'right',
    maxWidth: 110,
  },
  footnote: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  photoCard: {
    borderColor: withAlpha(colors.primary, 0.5),
    alignItems: 'flex-start',
  },
  photoText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
});

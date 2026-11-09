import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '../../../components/AppButton';
import { EmptyState } from '../../../components/EmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { getMuscleGroupLabel, type MuscleGroup } from '../../../constants/muscleGroups';
import { colors, fontSize, radius, sizes, spacing } from '../../../constants/theme';
import type { RootStackScreenProps } from '../../../navigation/navigationTypes';
import { showMessage } from '../../../utils/dialogs';
import type { WorkoutExercise } from '../../workouts/types/workout';
import { WORKOUT_LIMITS } from '../../workouts/utils/workoutValidation';
import { ExerciseCard } from '../components/ExerciseCard';
import { MuscleGroupFilter } from '../components/MuscleGroupFilter';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import type { Exercise } from '../types/exercise';
import { filterExercises } from '../utils/exerciseSearch';

/**
 * Catálogo de exercícios da API wger. No modo "browse" serve para consulta;
 * no modo "select" os exercícios escolhidos voltam para o formulário do treino.
 */
export function ExerciseCatalogScreen({ navigation, route }: RootStackScreenProps<'ExerciseCatalog'>) {
  const params = route.params;
  const isSelecting = params.mode === 'select';

  const [group, setGroup] = useState<MuscleGroup>(params.initialGroup ?? 'chest');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selection, setSelection] = useState<WorkoutExercise[]>(params.mode === 'select' ? params.selected : []);

  const isSearching = query.trim().length > 0;
  const catalog = useExerciseCatalog(group, isSearching);
  const visibleItems = useMemo(() => filterExercises(catalog.items, query), [catalog.items, query]);
  const selectedIds = useMemo(() => new Set(selection.map((item) => item.exerciseId)), [selection]);

  const handleSelectGroup = (nextGroup: MuscleGroup) => {
    setGroup(nextGroup);
    setExpandedId(null);
  };

  const toggleExpanded = useCallback((exerciseId: number) => {
    setExpandedId((current) => (current === exerciseId ? null : exerciseId));
  }, []);

  const toggleSelected = useCallback(
    (exercise: Exercise) => {
      const isSelected = selection.some((item) => item.exerciseId === exercise.id);
      if (!isSelected && selection.length >= WORKOUT_LIMITS.EXERCISES_MAX) {
        showMessage('Limite de exercícios', `Escolha até ${WORKOUT_LIMITS.EXERCISES_MAX} exercícios por treino.`);
        return;
      }
      setSelection((current) =>
        isSelected
          ? current.filter((item) => item.exerciseId !== exercise.id)
          : [...current, { exerciseId: exercise.id, name: exercise.name, muscleGroup: group }],
      );
    },
    [selection, group],
  );

  const handleConfirm = () => {
    if (params.mode !== 'select') return;
    if (params.target.screen === 'NewWorkout') {
      navigation.popTo('MainTabs', { screen: 'NewWorkout', params: { pickedExercises: selection } });
    } else {
      navigation.popTo('EditWorkout', { workoutId: params.target.workoutId, pickedExercises: selection });
    }
  };

  const renderFooter = () => {
    if (catalog.isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.footerText}>{isSearching ? 'Buscando em todo o grupo...' : 'Carregando mais...'}</Text>
        </View>
      );
    }
    if (catalog.loadMoreError) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{catalog.loadMoreError.message}</Text>
          <AppButton label="Tentar novamente" variant="secondary" icon="refresh" onPress={catalog.loadMore} />
        </View>
      );
    }
    if (catalog.status === 'ready' && !catalog.hasMore && catalog.items.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Fim da lista · Dados: wger.de (CC-BY-SA)</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (catalog.status === 'loading') {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.footerText}>Carregando exercícios da API wger...</Text>
        </View>
      );
    }
    if (catalog.status === 'error' && catalog.error) {
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title="Não foi possível carregar"
          message={`${catalog.error.message} Seus treinos e o ranking continuam funcionando normalmente.`}
          actionLabel="Tentar novamente"
          actionIcon="refresh"
          onAction={catalog.retry}
        />
      );
    }
    if (isSearching && catalog.hasMore) return null;
    return (
      <EmptyState
        icon="search-outline"
        title={isSearching ? 'Nenhum exercício encontrado' : 'Nenhum exercício disponível'}
        message={
          isSearching
            ? `Nenhum exercício de ${getMuscleGroupLabel(group)} corresponde a "${query.trim()}".`
            : 'A API não retornou exercícios para este grupo.'
        }
      />
    );
  };

  const countLabel =
    catalog.status !== 'ready'
      ? null
      : isSearching
        ? `${visibleItems.length} resultado(s) em ${catalog.items.length} de ${catalog.total ?? 0} exercícios`
        : `${catalog.items.length} de ${catalog.total ?? 0} exercícios de ${getMuscleGroupLabel(group)}`;

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={sizes.iconMd} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar exercício (ex.: supino)"
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Buscar exercício"
          />
          {isSearching && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={sizes.iconMd} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.filter}>
        <MuscleGroupFilter selected={group} onSelect={handleSelectGroup} />
      </View>
      {countLabel && <Text style={styles.countLabel}>{countLabel}</Text>}

      <FlatList
        data={visibleItems}
        keyExtractor={(exercise) => String(exercise.id)}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            expanded={expandedId === item.id}
            onToggleExpanded={toggleExpanded}
            selected={isSelecting ? selectedIds.has(item.id) : undefined}
            onToggleSelected={isSelecting ? toggleSelected : undefined}
          />
        )}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={isSearching ? undefined : catalog.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      {isSelecting && (
        <View style={styles.bottomBar}>
          <AppButton
            label={selection.length > 0 ? `Adicionar ${selection.length} ao treino` : 'Voltar sem exercícios'}
            icon={selection.length > 0 ? 'checkmark-circle-outline' : 'arrow-back'}
            onPress={handleConfirm}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
  },
  filter: {
    paddingVertical: spacing.md,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

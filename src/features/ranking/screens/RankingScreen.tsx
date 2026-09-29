import { FlatList, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { spacing } from '../../../constants/theme';
import { useRanking } from '../../../hooks/useRanking';
import { formatWeekRange, getWeekNumber } from '../../../utils/date';
import { RankingListItem } from '../components/RankingListItem';
import { RankingRules } from '../components/RankingRules';

export function RankingScreen() {
  const { sortedRankings, today } = useRanking();

  return (
    <ScreenContainer>
      <FlatList
        data={sortedRankings}
        keyExtractor={(ranking) => ranking.muscleGroup}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <AppHeader
            title="Ranking"
            subtitle={`Semana ${getWeekNumber(today)} · ${formatWeekRange(today)}`}
          />
        }
        renderItem={({ item, index }) => <RankingListItem ranking={item} position={index + 1} />}
        ItemSeparatorComponent={Separator}
        ListFooterComponent={RankingRules}
      />
    </ScreenContainer>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.md,
  },
});

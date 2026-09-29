import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RankName } from '../../../constants/rankingConfig';
import { rankColors } from '../../../constants/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const RANK_ICONS: Record<RankName, IconName> = {
  Iniciante: 'shield-outline',
  Bronze: 'shield-half-full',
  Prata: 'shield',
  Ouro: 'shield-star',
  Platina: 'shield-crown',
  Diamante: 'diamond-stone',
  Mestre: 'crown',
  Elite: 'fire',
};

export function getRankVisual(rank: RankName): { color: string; icon: IconName } {
  return { color: rankColors[rank], icon: RANK_ICONS[rank] };
}

import { useMemo, type Ref } from 'react';
import { Image, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fontWeight, photoShade, rankColors, withAlpha } from '../../../constants/theme';
import { formatShareDate } from '../../../utils/date';
import { hasPointsToShow } from '../services/photoData';
import type { PhotoMuscleGroupResult, WorkoutPhotoData } from '../types/photo';

/** Proporção 9:16 (largura / altura), adequada para stories. */
export const PHOTO_ASPECT_RATIO = 9 / 16;

/** Largura de referência do desenho: todas as medidas escalam a partir dela. */
const DESIGN_WIDTH = 360;

type WorkoutPhotoTemplateProps = {
  /** View capturada pelo react-native-view-shot. */
  ref?: Ref<ViewInstance>;
  photoUri: string;
  data: WorkoutPhotoData;
  width: number;
  accentColor: string;
  showRanks: boolean;
  showPoints: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
};

function getTitleFontSize(title: string): number {
  if (title.length <= 14) return 40;
  if (title.length <= 24) return 32;
  return 26;
}

/** Composição final: a foto ocupa todo o quadro e as informações ficam sobre um degradê. */
export function WorkoutPhotoTemplate({
  ref,
  photoUri,
  data,
  width,
  accentColor,
  showRanks,
  showPoints,
  onImageLoad,
  onImageError,
}: WorkoutPhotoTemplateProps) {
  const scale = width / DESIGN_WIDTH;
  const titleFontSize = getTitleFontSize(data.title);
  const scaled = useMemo(() => createScaledStyles(scale, titleFontSize), [scale, titleFontSize]);
  const height = width / PHOTO_ASPECT_RATIO;
  const pointsVisible = showPoints && hasPointsToShow(data);
  const useChips = showRanks || pointsVisible;
  // Com muitos grupos o painel cresce para cima; o degradê acompanha para manter o contraste.
  const bottomShadeRatio = useChips && data.groups.length > 3 ? 0.78 : 0.62;

  return (
    // `collapsable={false}` garante que a view exista no Android para a captura.
    <View ref={ref} collapsable={false} style={[styles.canvas, { width, height }]}>
      <Image
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onLoad={onImageLoad}
        onError={onImageError}
        accessibilityIgnoresInvertColors
      />
      <LinearGradient colors={[photoShade.soft, photoShade.none]} style={[styles.topShade, { height: height * 0.22 }]} />
      <LinearGradient
        colors={[photoShade.none, photoShade.medium, photoShade.strong]}
        locations={[0, 0.42, 1]}
        style={[styles.bottomShade, { height: height * bottomShadeRatio }]}
      />

      <View style={scaled.brand}>
        <View style={[scaled.brandMark, { backgroundColor: accentColor }]}>
          <MaterialCommunityIcons name="dumbbell" size={18 * scale} color={colors.onPrimary} />
        </View>
        <Text style={scaled.brandText}>
          GYM<Text style={{ color: accentColor }}>RANK</Text>
        </Text>
      </View>

      <View style={scaled.panel}>
        <Text style={[scaled.kicker, { color: accentColor }]}>TREINO CONCLUÍDO</Text>
        <Text style={scaled.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {data.title.toUpperCase()}
        </Text>

        <View style={scaled.stats}>
          <PhotoStat label="DATA" value={formatShareDate(data.date)} scaled={scaled} />
          {data.durationMinutes !== undefined && (
            <PhotoStat label="DURAÇÃO" value={`${data.durationMinutes} MIN`} scaled={scaled} />
          )}
        </View>

        <View style={scaled.divider} />

        <Text style={scaled.sectionLabel}>{showRanks ? 'RANK POR GRUPO' : 'GRUPOS TRABALHADOS'}</Text>
        {useChips ? (
          <View style={scaled.chips}>
            {data.groups.map((group) => (
              <GroupChip
                key={group.muscleGroup}
                group={group}
                scaled={scaled}
                showRank={showRanks}
                showPoints={pointsVisible}
                accentColor={accentColor}
              />
            ))}
          </View>
        ) : (
          <Text style={scaled.groupsLine}>{data.groups.map((group) => group.label.toUpperCase()).join('  •  ')}</Text>
        )}
      </View>
    </View>
  );
}

type ScaledStyles = ReturnType<typeof createScaledStyles>;

function PhotoStat({ label, value, scaled }: { label: string; value: string; scaled: ScaledStyles }) {
  return (
    <View>
      <Text style={scaled.statLabel}>{label}</Text>
      <Text style={scaled.statValue}>{value}</Text>
    </View>
  );
}

type GroupChipProps = {
  group: PhotoMuscleGroupResult;
  scaled: ScaledStyles;
  showRank: boolean;
  showPoints: boolean;
  accentColor: string;
};

function GroupChip({ group, scaled, showRank, showPoints, accentColor }: GroupChipProps) {
  const rankColor = rankColors[group.rank];

  return (
    <View style={[scaled.chip, showRank && { borderColor: withAlpha(rankColor, 0.65) }]}>
      <Text style={scaled.chipLabel}>{group.label.toUpperCase()}</Text>
      {showRank && (
        <>
          <View style={[scaled.rankDot, { backgroundColor: rankColor }]} />
          <Text style={[scaled.chipValue, { color: rankColor }]}>{group.rank.toUpperCase()}</Text>
        </>
      )}
      {showPoints && group.pointsEarned !== null && (
        <Text style={[scaled.chipValue, { color: accentColor }]}>+{group.pointsEarned} PTS</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    // Fundo opaco evita pixels transparentes ou pretos na imagem exportada.
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

/** Estilos dependentes do tamanho: a mesma composição em qualquer largura. */
function createScaledStyles(s: number, titleFontSize: number) {
  return StyleSheet.create({
    brand: {
      position: 'absolute',
      top: 22 * s,
      left: 20 * s,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * s,
    },
    brandMark: {
      width: 30 * s,
      height: 30 * s,
      borderRadius: 15 * s,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandText: {
      color: colors.text,
      fontSize: 17 * s,
      fontWeight: fontWeight.black,
      letterSpacing: 3 * s,
    },
    panel: {
      position: 'absolute',
      left: 22 * s,
      right: 22 * s,
      bottom: 26 * s,
    },
    kicker: {
      fontSize: 12 * s,
      fontWeight: fontWeight.black,
      letterSpacing: 2.4 * s,
    },
    title: {
      color: colors.text,
      fontSize: titleFontSize * s,
      lineHeight: titleFontSize * 1.06 * s,
      fontWeight: fontWeight.black,
      marginTop: 6 * s,
    },
    stats: {
      flexDirection: 'row',
      gap: 24 * s,
      marginTop: 14 * s,
    },
    statLabel: {
      color: withAlpha(colors.text, 0.6),
      fontSize: 10 * s,
      fontWeight: fontWeight.bold,
      letterSpacing: 1.6 * s,
    },
    statValue: {
      color: colors.text,
      fontSize: 20 * s,
      fontWeight: fontWeight.black,
      marginTop: 2 * s,
    },
    divider: {
      height: Math.max(1, s),
      backgroundColor: photoShade.divider,
      marginVertical: 14 * s,
    },
    sectionLabel: {
      color: withAlpha(colors.text, 0.6),
      fontSize: 10 * s,
      fontWeight: fontWeight.bold,
      letterSpacing: 1.6 * s,
      marginBottom: 8 * s,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6 * s,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6 * s,
      paddingHorizontal: 10 * s,
      paddingVertical: 6 * s,
      borderRadius: 999,
      borderWidth: Math.max(1, s),
      borderColor: photoShade.divider,
      backgroundColor: photoShade.chip,
    },
    chipLabel: {
      color: colors.text,
      fontSize: 12 * s,
      fontWeight: fontWeight.bold,
    },
    rankDot: {
      width: 6 * s,
      height: 6 * s,
      borderRadius: 3 * s,
    },
    chipValue: {
      fontSize: 12 * s,
      fontWeight: fontWeight.black,
    },
    groupsLine: {
      color: colors.text,
      fontSize: 15 * s,
      lineHeight: 21 * s,
      fontWeight: fontWeight.bold,
    },
  });
}

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  fontSize,
  fontWeight,
  PHOTO_ACCENT_IDS,
  photoAccentColors,
  radius,
  sizes,
  spacing,
  withAlpha,
  type PhotoAccentId,
} from '../../../constants/theme';
import type { AppSettings } from '../../../services/storage/settingsStorage';
import { PHOTO_ACCENT_LABELS } from '../constants/photoOptions';

type PhotoCustomizationBarProps = {
  showRanks: boolean;
  showPoints: boolean;
  accent: PhotoAccentId;
  /** Falso quando o treino não alterou a pontuação: nenhum ponto pode aparecer. */
  pointsAvailable: boolean;
  disabled?: boolean;
  onChange: (changes: Partial<AppSettings>) => void;
};

/** Personalização da composição. As escolhas viram preferências salvas no AsyncStorage. */
export function PhotoCustomizationBar({
  showRanks,
  showPoints,
  accent,
  pointsAvailable,
  disabled = false,
  onChange,
}: PhotoCustomizationBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ToggleChip
          label="Ranks"
          value={showRanks}
          disabled={disabled}
          onToggle={() => onChange({ photoShowRanks: !showRanks })}
        />
        <ToggleChip
          label="Pontos"
          value={showPoints && pointsAvailable}
          disabled={disabled || !pointsAvailable}
          onToggle={() => onChange({ photoShowPoints: !showPoints })}
        />
        <View style={styles.accents}>
          {PHOTO_ACCENT_IDS.map((accentId) => {
            const isSelected = accentId === accent;
            return (
              <Pressable
                key={accentId}
                onPress={() => onChange({ photoAccent: accentId })}
                disabled={disabled}
                hitSlop={4}
                accessibilityRole="radio"
                accessibilityLabel={`Cor de destaque ${PHOTO_ACCENT_LABELS[accentId]}`}
                accessibilityState={{ selected: isSelected, disabled }}
                style={[styles.accentRing, isSelected && { borderColor: photoAccentColors[accentId] }]}
              >
                <View style={[styles.accentDot, { backgroundColor: photoAccentColors[accentId] }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
      {!pointsAvailable && (
        <Text style={styles.hint}>Este treino não alterou a pontuação, então nenhum ponto aparece na imagem.</Text>
      )}
    </View>
  );
}

type ToggleChipProps = {
  label: string;
  value: boolean;
  disabled: boolean;
  onToggle: () => void;
};

function ToggleChip({ label, value, disabled, onToggle }: ToggleChipProps) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={`Mostrar ${label.toLowerCase()} na foto`}
      accessibilityState={{ checked: value, disabled }}
      style={[styles.chip, value && styles.chipActive, disabled && styles.chipDisabled]}
    >
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={sizes.iconSm}
        color={value ? colors.primary : colors.textMuted}
      />
      <Text style={[styles.chipLabel, value && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const ACCENT_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchTarget - 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: withAlpha(colors.primary, 0.6),
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chipLabelActive: {
    color: colors.text,
  },
  accents: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  accentRing: {
    width: sizes.touchTarget - 8,
    height: sizes.touchTarget - 8,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDot: {
    width: ACCENT_SIZE,
    height: ACCENT_SIZE,
    borderRadius: ACCENT_SIZE / 2,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
  },
});

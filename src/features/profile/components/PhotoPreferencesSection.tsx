import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

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
} from '../../../constants/theme';
import { useSettings } from '../../../hooks/useSettings';
import type { AppSettings } from '../../../services/storage/settingsStorage';
import { getErrorMessage, showMessage } from '../../../utils/dialogs';
import { PHOTO_ACCENT_LABELS } from '../../workout-photo/constants/photoOptions';

/** Preferências da imagem compartilhável, guardadas no AsyncStorage do aparelho. */
export function PhotoPreferencesSection() {
  const { settings, updateSettings } = useSettings();

  const change = (changes: Partial<AppSettings>) => {
    updateSettings(changes).catch((error: unknown) => showMessage('Preferência não salva', getErrorMessage(error)));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Preferências da foto do treino</Text>

      <PreferenceSwitch
        label="Mostrar o rank de cada grupo"
        value={settings.photoShowRanks}
        onChange={(value) => change({ photoShowRanks: value })}
      />
      <PreferenceSwitch
        label="Mostrar os pontos conquistados"
        value={settings.photoShowPoints}
        onChange={(value) => change({ photoShowPoints: value })}
      />

      <View style={styles.accentRow}>
        <Text style={styles.label}>Cor de destaque</Text>
        <View style={styles.accents}>
          {PHOTO_ACCENT_IDS.map((accentId) => {
            const isSelected = settings.photoAccent === accentId;
            return (
              <Pressable
                key={accentId}
                onPress={() => change({ photoAccent: accentId })}
                accessibilityRole="radio"
                accessibilityLabel={`Cor de destaque ${PHOTO_ACCENT_LABELS[accentId]}`}
                accessibilityState={{ selected: isSelected }}
                style={[styles.accentRing, isSelected && { borderColor: photoAccentColors[accentId] }]}
              >
                <View style={[styles.accentDot, { backgroundColor: photoAccentColors[accentId] }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={styles.note}>Salvas neste aparelho e usadas como padrão em toda nova foto.</Text>
    </View>
  );
}

function PreferenceSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: colors.surfacePressed, true: withAlpha(colors.primary, 0.6) }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.surfacePressed}
      />
    </View>
  );
}

const ACCENT_SIZE = 22;

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
  },
  label: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accents: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  accentRing: {
    width: sizes.touchTarget - 4,
    height: sizes.touchTarget - 4,
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
  note: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
  },
});

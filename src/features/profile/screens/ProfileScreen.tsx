import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '../../../components/AppButton';
import { AppHeader } from '../../../components/AppHeader';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { StatCard } from '../../../components/StatCard';
import { images } from '../../../constants/images';
import { colors, fontSize, fontWeight, radius, sizes, spacing } from '../../../constants/theme';
import { useProfile } from '../../../hooks/useProfile';
import { formatDate } from '../../../utils/date';
import { getErrorMessage, showMessage } from '../../../utils/dialogs';
import { PROFILE_NAME_MAX_LENGTH } from '../types/profile';
import { DevToolsSection } from '../components/DevToolsSection';

export function ProfileScreen() {
  const { profile, updateProfileName, totalWorkouts, weeksTracked } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setNameDraft(profile.name);
    setNameError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!nameDraft.trim()) {
      setNameError('O nome não pode ficar vazio.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfileName(nameDraft);
      setIsEditing(false);
      showMessage('Perfil atualizado', 'Seu nome foi salvo.');
    } catch (error) {
      showMessage('Erro ao salvar', getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppHeader title="Perfil" subtitle="Sua jornada no GymRank" />

          <View style={styles.identity}>
            <Image
              source={images.avatar}
              style={styles.avatar}
              accessibilityLabel="Avatar do usuário"
              accessibilityIgnoresInvertColors
            />

            {isEditing ? (
              <View style={styles.editArea}>
                <TextInput
                  value={nameDraft}
                  onChangeText={(text) => {
                    setNameDraft(text);
                    setNameError(null);
                  }}
                  autoFocus
                  maxLength={PROFILE_NAME_MAX_LENGTH}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.textSubtle}
                  selectionColor={colors.primary}
                  accessibilityLabel="Nome do usuário"
                  style={[styles.input, nameError && styles.inputError]}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                {nameError && <Text style={styles.error}>{nameError}</Text>}
                <View style={styles.editActions}>
                  <View style={styles.flex}>
                    <AppButton label="Cancelar" variant="secondary" onPress={() => setIsEditing(false)} />
                  </View>
                  <View style={styles.flex}>
                    <AppButton label="Salvar" onPress={handleSave} loading={isSaving} />
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={startEditing}
                accessibilityRole="button"
                accessibilityLabel={`Nome: ${profile.name}. Editar nome`}
                style={({ pressed }) => [styles.nameRow, pressed && styles.pressed]}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {profile.name}
                </Text>
                <Ionicons name="pencil" size={sizes.iconSm} color={colors.primary} />
              </Pressable>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.statsRow}>
              <StatCard label="Treinos registrados" value={totalWorkouts} icon="barbell-outline" />
              <StatCard label="Semanas acompanhadas" value={weeksTracked} icon="calendar-outline" />
            </View>
            <StatCard label="Início do acompanhamento" value={formatDate(profile.startDate)} icon="flag-outline" />
          </View>

          {__DEV__ && <DevToolsSection />}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: sizes.avatarLg,
    height: sizes.avatarLg,
    borderRadius: sizes.avatarLg / 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    maxWidth: '100%',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    flexShrink: 1,
  },
  editArea: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  input: {
    minHeight: sizes.touchTarget + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stats: {
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

import { useState } from 'react';
import { StyleSheet, ScrollView, View, Alert, Pressable, Platform } from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStore } from '@/src/store/appStore';
import { clearScanHistory } from '@/src/db/queries';
import { colors, ratingColors, typography, spacing, radius, shadows } from '@/src/theme/design';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const FODMAP_CATEGORY_KEYS = [
  { key: 'fodmapFructans', icon: 'grain', color: colors.coral },
  { key: 'fodmapGOS', icon: 'seed-outline', color: colors.coral },
  { key: 'fodmapLactose', icon: 'cow', color: colors.amber },
  { key: 'fodmapFructose', icon: 'fruit-cherries', color: colors.amber },
  { key: 'fodmapSorbitol', icon: 'fruit-pineapple', color: colors.amber },
  { key: 'fodmapMannitol', icon: 'mushroom-outline', color: colors.amber },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showFodmapGuide, setShowFodmapGuide] = useState(false);

  const handleClearHistory = () => {
    Alert.alert(t('history.clearAll'), t('history.clearConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await clearScanHistory(db);
        },
      },
    ]);
  };

  const currentLang = LANGUAGES.find((l) => l.code === language);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
      <Pressable style={styles.settingRow} onPress={() => setShowLanguages(!showLanguages)}>
        <View style={styles.settingIcon}>
          <MaterialCommunityIcons name="translate" size={22} color={colors.sage} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('settings.language')}</Text>
          <Text style={styles.settingValue}>{currentLang?.flag} {currentLang?.label}</Text>
        </View>
        <MaterialCommunityIcons
          name={showLanguages ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
      {showLanguages && (
        <View style={styles.languageList}>
          <RadioButton.Group
            value={language}
            onValueChange={(value) => {
              setLanguage(value);
              setShowLanguages(false);
            }}
          >
            {LANGUAGES.map((lang) => (
              <RadioButton.Item
                key={lang.code}
                label={`${lang.flag}  ${lang.label}`}
                value={lang.code}
                style={styles.radioItem}
                labelStyle={styles.radioLabel}
                color={colors.sage}
              />
            ))}
          </RadioButton.Group>
        </View>
      )}

      <Text style={styles.sectionLabel}>{t('revamp.settings.learnSection')}</Text>
      <Pressable style={styles.settingRow} onPress={() => setShowFodmapGuide(!showFodmapGuide)}>
        <View style={[styles.settingIcon, { backgroundColor: colors.sageMuted }]}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color={colors.sage} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('settings.fodmapGuide')}</Text>
          <Text style={styles.settingValue}>{t('revamp.settings.learnBody')}</Text>
        </View>
        <MaterialCommunityIcons
          name={showFodmapGuide ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>

      {showFodmapGuide && (
        <View style={styles.guideContainer}>
          <View style={styles.guideCard}>
            <Text style={styles.guideIntro}>{t('settings.fodmapGuideIntro')}</Text>
          </View>

          <View style={styles.guideCard}>
            <Text style={styles.guideHeading}>{t('settings.fodmapCategories')}</Text>
            {FODMAP_CATEGORY_KEYS.map(({ key, icon, color }) => (
              <View key={key} style={styles.categoryRow}>
                <View style={[styles.categoryIcon, { backgroundColor: `${color}18` }]}>
                  <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <Text style={styles.categoryText}>{t(`settings.${key}`)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.guideCard}>
            <View style={styles.foodHeaderRow}>
              <View style={[styles.foodDot, { backgroundColor: ratingColors.green.dot }]} />
              <Text style={[styles.guideHeading, { color: ratingColors.green.text, marginBottom: 0 }]}>
                {t('settings.fodmapSafeFoods')}
              </Text>
            </View>
            <Text style={styles.guideFoodList}>{t('settings.fodmapSafeFoodsList')}</Text>
          </View>

          <View style={styles.guideCard}>
            <View style={styles.foodHeaderRow}>
              <View style={[styles.foodDot, { backgroundColor: ratingColors.red.dot }]} />
              <Text style={[styles.guideHeading, { color: ratingColors.red.text, marginBottom: 0 }]}>
                {t('settings.fodmapHighFoods')}
              </Text>
            </View>
            <Text style={styles.guideFoodList}>{t('settings.fodmapHighFoodsList')}</Text>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.sageMuted }]}>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.sageDark} />
              <Text style={styles.tipText}>{t('settings.fodmapTip')}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>{t('revamp.settings.dataSection')}</Text>
      <Pressable style={styles.settingRow} onPress={handleClearHistory}>
        <View style={[styles.settingIcon, { backgroundColor: colors.coralMuted }]}>
          <MaterialCommunityIcons name="delete-outline" size={22} color={colors.coral} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.coral }]}>{t('settings.clearHistory')}</Text>
          <Text style={styles.settingValue}>{t('revamp.settings.removeLocalScans')}</Text>
        </View>
      </Pressable>

      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color={colors.sage} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>{t('settings.about')}</Text>
          <Text style={styles.infoText}>{t('settings.aboutText')}</Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.amberMuted }]}>
        <MaterialCommunityIcons name="alert-outline" size={20} color={colors.amberDark} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.amberDark }]}>{t('settings.disclaimer')}</Text>
          <Text style={styles.infoText}>{t('settings.disclaimerText')}</Text>
        </View>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>{t('settings.version')} 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  sectionLabel: {
    ...typography.labelLarge,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  languageList: {
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.sm,
  },
  radioItem: {
    paddingLeft: spacing.md,
  },
  radioLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  guideContainer: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  guideCard: {
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.sm,
  },
  guideIntro: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  guideHeading: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
  },
  foodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  foodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  guideFoodList: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: {
    ...typography.bodyMedium,
    color: colors.sageDark,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  version: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  versionText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});

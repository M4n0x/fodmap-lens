import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '@/src/theme/design';
import type { OFFProduct } from '@/src/types/product';

const LEVEL_CONFIG = {
  low: { color: colors.sage, icon: 'circle' as const, label: 'nutrient.low' },
  moderate: { color: colors.amber, icon: 'circle' as const, label: 'nutrient.moderate' },
  high: { color: colors.coral, icon: 'circle' as const, label: 'nutrient.high' },
};

const NUTRIENT_KEYS = [
  { key: 'fat', icon: 'water', label: 'nutrient.fat' },
  { key: 'saturated-fat', icon: 'water-opacity', label: 'nutrient.saturatedFat' },
  { key: 'sugars', icon: 'cube-outline', label: 'nutrient.sugars' },
  { key: 'salt', icon: 'shaker-outline', label: 'nutrient.salt' },
] as const;

const NUTRISCORE_COLORS: Record<string, string> = {
  a: '#038141',
  b: '#85BB2F',
  c: '#FECB02',
  d: '#EE8100',
  e: '#E63E11',
};

interface NutrientLevelsProps {
  product: OFFProduct;
  embedded?: boolean;
}

export function NutrientLevels({ product, embedded }: NutrientLevelsProps) {
  const { t } = useTranslation();
  const levels = product.nutrient_levels;
  const grade = product.nutriscore_grade?.toLowerCase();

  if (!levels || Object.keys(levels).length === 0) return null;

  return (
    <View style={embedded ? styles.cardEmbedded : styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nutrient.title')}</Text>
        {grade && NUTRISCORE_COLORS[grade] && (
          <View style={[styles.nutriscoreBadge, { backgroundColor: NUTRISCORE_COLORS[grade] }]}>
            <Text style={styles.nutriscoreText}>{grade.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {NUTRIENT_KEYS.map(({ key, icon, label }) => {
        const level = levels[key];
        if (!level) return null;
        const config = LEVEL_CONFIG[level];
        const nutrimentKey = `${key}_100g`;
        const value = product.nutriments?.[nutrimentKey];

        return (
          <View key={key} style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name={icon} size={16} color={colors.textSecondary} />
              <Text style={styles.nutrientName}>{t(label)}</Text>
            </View>
            <View style={styles.rowRight}>
              {value != null && (
                <Text style={styles.nutrientValue}>
                  {typeof value === 'number' ? `${parseFloat(value.toFixed(2))}g` : value}
                </Text>
              )}
              <View style={[styles.levelDot, { backgroundColor: config.color }]} />
              <Text style={[styles.levelText, { color: config.color }]}>
                {t(config.label)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardEmbedded: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
  },
  nutriscoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutriscoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nutrientName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  nutrientValue: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelText: {
    ...typography.bodySmall,
    fontWeight: '700',
    minWidth: 60,
  },
});

import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { TrafficLight } from '@/src/components/common/TrafficLight';
import { FODMAP_CATEGORIES } from '@/src/types/fodmap';
import type { FodmapAnalysis, FodmapRating } from '@/src/types/fodmap';
import { colors, ratingColors, paletteForRating, typography, spacing, radius, shadows } from '@/src/theme/design';

interface FodmapBreakdownProps {
  analysis: FodmapAnalysis;
  embedded?: boolean;
}

export function FodmapBreakdown({ analysis, embedded }: FodmapBreakdownProps) {
  const { t } = useTranslation();

  return (
    <View style={embedded ? styles.cardEmbedded : styles.card}>
      <Text style={styles.title}>{t('product.fodmapBreakdown')}</Text>
      {FODMAP_CATEGORIES.map((cat, idx) => {
        const { rating, triggerIngredients } = analysis.categories[cat];
        const isLast = idx === FODMAP_CATEGORIES.length - 1;
        const palette = paletteForRating(rating);

        return (
          <View key={cat} style={[styles.row, !isLast && styles.rowBorder]}>
            <View style={styles.categoryInfo}>
              <View style={styles.categoryTitleRow}>
                <View style={[styles.categoryDot, { backgroundColor: palette.dot }]} />
                <Text style={styles.categoryName}>{t(`product.categories.${cat}`)}</Text>
              </View>
              <Text style={styles.triggers} numberOfLines={2}>
                {triggerIngredients.length > 0 ? triggerIngredients.join(', ') : t('revamp.product.noClearTriggers')}
              </Text>
            </View>
            <View style={[styles.badgeWrap, { backgroundColor: palette.bg }]}>
              <TrafficLight rating={rating} size="sm" showBadge label={t(`product.ratings.${rating}`)} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardEmbedded: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  title: {
    ...typography.titleMedium,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  categoryInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  triggers: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  badgeWrap: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

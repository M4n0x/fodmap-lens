import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MatchedIngredient } from '@/src/types/fodmap';
import { colors, typography, spacing, radius, shadows } from '@/src/theme/design';

interface ServingInfoProps {
  ingredients: MatchedIngredient[];
  embedded?: boolean;
}

export function ServingInfo({ ingredients, embedded }: ServingInfoProps) {
  const { t } = useTranslation();

  const withServings = ingredients.filter(
    (i) =>
      i.fodmapIngredient &&
      (i.fodmapIngredient.safe_serving_g || i.fodmapIngredient.moderate_serving_g)
  );

  if (withServings.length === 0) return null;

  return (
    <View style={embedded ? styles.cardEmbedded : styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('product.servingInfo')}</Text>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="scale-balance" size={18} color={colors.sage} />
        </View>
      </View>
      {withServings.map((ing, idx) => {
        const isLast = idx === withServings.length - 1;
        return (
          <View key={`${ing.name}-${idx}`} style={[styles.row, !isLast && styles.rowBorder]}>
            <Text style={styles.ingredientName}>{ing.name}</Text>
            <View style={styles.servings}>
              {ing.fodmapIngredient?.safe_serving_g && (
                <View style={[styles.servingChip, styles.safeChip]}>
                  <View style={[styles.servingDot, { backgroundColor: colors.sage }]} />
                  <Text style={styles.safeText}>
                    {t('product.safeServing')}: {ing.fodmapIngredient.safe_serving_g}g
                  </Text>
                </View>
              )}
              {ing.fodmapIngredient?.moderate_serving_g && (
                <View style={[styles.servingChip, styles.moderateChip]}>
                  <View style={[styles.servingDot, { backgroundColor: colors.amber }]} />
                  <Text style={styles.moderateText}>
                    {t('product.moderateServing')}: {ing.fodmapIngredient.moderate_serving_g}g
                  </Text>
                </View>
              )}
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
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleMedium,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    paddingVertical: spacing.sm + 2,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  ingredientName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  servings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  servingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  safeChip: {
    backgroundColor: colors.sageMuted,
  },
  moderateChip: {
    backgroundColor: colors.amberMuted,
  },
  servingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  safeText: {
    ...typography.bodySmall,
    color: colors.sageDark,
  },
  moderateText: {
    ...typography.bodySmall,
    color: colors.amberDark,
  },
});

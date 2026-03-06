import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { MatchedIngredient } from '@/src/types/fodmap';
import { colors, paletteForRating, typography, spacing, radius, shadows } from '@/src/theme/design';

interface IngredientListProps {
  ingredients: MatchedIngredient[];
  embedded?: boolean;
}

export function IngredientList({ ingredients, embedded }: IngredientListProps) {
  const { t } = useTranslation();

  return (
    <View style={embedded ? styles.cardEmbedded : styles.card}>
      <Text style={styles.title}>{t('product.ingredients')}</Text>

      <View style={styles.chipContainer}>
        {ingredients.map((ing, idx) => {
          const chipColors = paletteForRating(ing.fodmapIngredient?.overall_rating ?? null);

          return (
            <View key={`${ing.name}-${idx}`} style={[styles.chip, { backgroundColor: chipColors.bg }]}>
              <Text style={[styles.chipText, { color: chipColors.text }]}>
                {ing.name}
                {ing.matchType === 'unknown' ? ' ?' : ''}
              </Text>
            </View>
          );
        })}
      </View>
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
    padding: spacing.lg, // Added back padding
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  title: {
    ...typography.titleMedium,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.full,
  },
  chipText: {
    ...typography.bodySmall,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

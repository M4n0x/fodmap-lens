import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FODMAP_GROUPS } from '@/src/types/fodmap';
import type { FodmapAnalysis, FodmapRating } from '@/src/types/fodmap';
import { colors, ratingColors, paletteForRating, typography, spacing, radius, shadows } from '@/src/theme/design';

function worstRating(ratings: FodmapRating[]): FodmapRating {
  if (ratings.includes('red')) return 'red';
  if (ratings.includes('yellow')) return 'yellow';
  return 'green';
}

interface ReintroductionGroupsProps {
  analysis: FodmapAnalysis;
  embedded?: boolean;
}

export function ReintroductionGroups({ analysis, embedded }: ReintroductionGroupsProps) {
  const { t } = useTranslation();

  const groupData = useMemo(() =>
    FODMAP_GROUPS.map((g) => {
      const ratings = g.categories.map((cat) => analysis.categories[cat].rating);
      const triggers = g.categories.flatMap((cat) => analysis.categories[cat].triggerIngredients);
      const rating = worstRating(ratings);
      return { ...g, rating, triggers };
    }),
    [analysis]
  );

  const hasAffected = groupData.some((g) => g.rating !== 'green');
  if (!hasAffected) return null;

  return (
    <View style={embedded ? styles.cardEmbedded : styles.card}>
      <Text style={styles.title}>{t('product.reintroGroups')}</Text>
      <Text style={styles.subtitle}>{t('product.reintroGroupsHint')}</Text>

      <View style={styles.groupGrid}>
        {groupData.map((g) => {
          const isAffected = g.rating !== 'green';
          const palette = paletteForRating(g.rating);

          return (
            <View
              key={g.key}
              style={[
                styles.groupCard,
                { borderColor: isAffected ? palette.dot : colors.borderLight },
                isAffected && { backgroundColor: palette.bg },
              ]}
            >
              <View style={styles.groupHeader}>
                <View style={[styles.groupIconWrap, { backgroundColor: isAffected ? palette.dot : colors.borderLight }]}>
                  <MaterialCommunityIcons
                    name={g.icon}
                    size={16}
                    color={isAffected ? '#fff' : colors.textMuted}
                  />
                </View>
                <Text style={[styles.groupNumber, isAffected && { color: palette.text }]}>
                  {t(g.label)}
                </Text>
              </View>
              <Text style={[styles.groupName, isAffected && { color: palette.text }]}>
                {g.categories.map((cat) => t(`product.categories.${cat}`)).join(', ')}
              </Text>
              {isAffected && g.triggers.length > 0 && (
                <Text style={[styles.groupTriggers, { color: palette.text }]} numberOfLines={2}>
                  {g.triggers.join(', ')}
                </Text>
              )}
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  title: {
    ...typography.titleMedium,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  groupCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.warmWhite,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupNumber: {
    ...typography.labelSmall,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  groupName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  groupTriggers: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
});

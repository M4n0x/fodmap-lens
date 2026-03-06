import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { FodmapRating } from '@/src/types/fodmap';
import { colors, ratingColors, typography, spacing, radius, shadows } from '@/src/theme/design';

interface FodmapScoreProps {
  score: number;
  rating: FodmapRating;
}

function gradientForRating(rating: FodmapRating): readonly [string, string] {
  if (rating === 'yellow') return ['#F7E8C9', '#FFF8ED'];
  if (rating === 'red') return ['#F3DDD8', '#FFF3F1'];
  return ['#DDEEDF', '#F4FAF5'];
}

export function FodmapScore({ score, rating }: FodmapScoreProps) {
  const { t } = useTranslation();
  const palette = ratingColors[rating];

  return (
    <LinearGradient colors={gradientForRating(rating)} style={styles.card}>
      <View style={styles.scoreRow}>
        <View style={[styles.badge, { backgroundColor: palette.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: palette.dot }]} />
          <Text style={[styles.badgeText, { color: palette.text }]}>{t(`product.ratings.${rating}`)}</Text>
        </View>
        <View style={[styles.scoreCard, { backgroundColor: palette.dot }]}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: 22,
    ...shadows.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.labelSmall,
  },
  scoreCard: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 48,
    color: colors.textOnDark,
  },
});

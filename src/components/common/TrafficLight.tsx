import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { FodmapRating } from '@/src/types/fodmap';
import { ratingColors, radius, spacing, shadows } from '@/src/theme/design';

interface TrafficLightProps {
  rating: FodmapRating;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showBadge?: boolean;
}

const SIZES = {
  sm: { dot: 10, badge: 24, fontSize: 10 },
  md: { dot: 14, badge: 30, fontSize: 11 },
  lg: { dot: 18, badge: 36, fontSize: 12 },
};

export function TrafficLight({ rating, size = 'md', label, showBadge }: TrafficLightProps) {
  const colors = ratingColors[rating];
  const dim = SIZES[size];

  if (showBadge) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.bg, minHeight: dim.badge }]}>
        <View
          style={[
            styles.dot,
            { width: dim.dot, height: dim.dot, borderRadius: dim.dot / 2, backgroundColor: colors.dot },
          ]}
        />
        {label && (
          <Text style={[styles.badgeLabel, { color: colors.text, fontSize: dim.fontSize }]}>
            {label}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          shadows.sm,
          {
            width: dim.dot,
            height: dim.dot,
            borderRadius: dim.dot / 2,
            backgroundColor: colors.dot,
          },
        ]}
      />
      {label && (
        <Text style={[styles.label, { color: colors.text, fontSize: dim.fontSize }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  badgeLabel: {
    fontWeight: '600',
  },
  label: {
    fontWeight: '500',
  },
});

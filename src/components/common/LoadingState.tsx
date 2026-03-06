import { StyleSheet, View, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { colors, typography, spacing } from '@/src/theme/design';

const DOT_SIZES = [10, 14, 10];
const DOT_DELAYS = [0, 150, 300];

export function LoadingState({ message }: { message?: string }) {
  const { t } = useTranslation();
  const anims = useRef(DOT_SIZES.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(DOT_DELAYS[i]),
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [anims]);

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {DOT_SIZES.map((size, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: anims[i],
                transform: [{ scale: anims[i] }],
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.text}>
        {message ?? t('common.loading')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cream,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    backgroundColor: colors.sage,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
});

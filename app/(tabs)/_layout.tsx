import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, shadows } from '@/src/theme/design';
import { emitTabRepress } from '@/src/utils/tabEvents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const ICON_MAP: Record<string, string> = {
  index: 'barcode-scan',
  history: 'history',
  search: 'magnify',
  settings: 'cog-outline',
};

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 220,
  mass: 0.7,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  route,
  label,
  isFocused,
  onPress,
  onLayout,
  accessibilityLabel,
}: {
  route: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  accessibilityLabel?: string;
}) {
  const iconName = ICON_MAP[route] ?? 'circle';
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 360 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={onLayout}
      style={[styles.tabItem, containerStyle]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.tabIconShell}>
        <MaterialCommunityIcons
          name={iconName}
          size={20}
          color={isFocused ? colors.sageDark : colors.textSecondary}
        />
      </View>
      <Animated.Text
        style={[styles.tabLabel, { color: isFocused ? colors.sageDark : colors.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

function EditorialTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 14);

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});

  const updateIndicator = useCallback((index: number, x: number, width: number) => {
    setLayouts((prev) => ({ ...prev, [index]: { x, width } }));
  }, []);

  useEffect(() => {
    const layout = layouts[state.index];
    if (layout) {
      indicatorX.value = withSpring(layout.x, SPRING_CONFIG);
      indicatorWidth.value = withSpring(layout.width, SPRING_CONFIG);
    }
  }, [indicatorWidth, indicatorX, layouts, state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View style={[styles.floatingContainer, { bottom: bottomPadding }]}>
      <View style={styles.shadowLayer} />
      <View style={styles.barShell}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (isFocused) {
                emitTabRepress(route.name);
              } else if (!event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }
            };

            const onLayout = (e: LayoutChangeEvent) => {
              const { x, width } = e.nativeEvent.layout;
              updateIndicator(index, x, width);
              if (isFocused && indicatorWidth.value === 0) {
                indicatorX.value = x;
                indicatorWidth.value = width;
              }
            };

            return (
              <TabItem
                key={route.key}
                route={route.name}
                label={label}
                isFocused={isFocused}
                onPress={onPress}
                onLayout={onLayout}
                accessibilityLabel={options.tabBarAccessibilityLabel}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <EditorialTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.cream,
        },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          ...typography.titleLarge,
          color: colors.textPrimary,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.scan') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history') }} />
      <Tabs.Screen name="search" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}

const BAR_RADIUS = 30;

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  shadowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_RADIUS,
    backgroundColor: colors.cardBg,
    ...shadows.lg,
  },
  barShell: {
    width: '100%',
    borderRadius: BAR_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.94)',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(91, 138, 114, 0.10)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 2,
  },
  tabIconShell: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

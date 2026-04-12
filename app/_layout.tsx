import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { initializeDatabase } from '@/src/db/migrations';
import { queryClient } from '@/src/queryClient';
import { colors } from '@/src/theme/design';
import { useAppStore } from '@/src/store/appStore';
import { warmFuseIndex } from '@/src/services/fodmapEngine';
import '@/src/i18n';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.sage,
    secondary: colors.amber,
    error: colors.coral,
    background: colors.cream,
    surface: colors.cardBg,
    surfaceVariant: colors.warmWhite,
    outline: colors.border,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
  },
};

function FuseWarmup() {
  const db = useSQLiteContext();
  useEffect(() => { warmFuseIndex(db); }, [db]);
  return null;
}

function AppContent() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[barcode]"
        options={{ title: '', headerBackTitle: t('revamp.common.back') }}
      />
      <Stack.Screen
        name="ocr-scan"
        options={{ title: '', headerBackTitle: t('revamp.common.back'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const restoreLanguage = useAppStore((s) => s.restoreLanguage);

  useEffect(() => {
    restoreLanguage().finally(() => SplashScreen.hideAsync());
  }, [restoreLanguage]);

  return (
    <SQLiteProvider databaseName="fodmap.db" onInit={initializeDatabase}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <FuseWarmup />
          <AppContent />
        </PaperProvider>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}

import { useCallback, useMemo, memo } from 'react';
import { StyleSheet, View, FlatList, Pressable, Image, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSQLiteContext } from 'expo-sqlite';
import { useScanHistory } from '@/src/hooks/useScanHistory';
import { deleteScanHistoryItem } from '@/src/db/queries';
import { LoadingState } from '@/src/components/common/LoadingState';
import type { ScanHistoryItem } from '@/src/types/product';
import { Platform } from 'react-native';
import { colors, ratingColors, paletteForRating, typography, spacing, radius, shadows } from '@/src/theme/design';

const HistoryCard = memo(function HistoryCard({
  item,
  onPress,
  onLongPress,
}: {
  item: ScanHistoryItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { t } = useTranslation();
  const date = new Date(item.scanned_at);
  const timeStr = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const rating = item.overall_rating;
  const palette = paletteForRating(rating);
  const imageUrl = item.image_url;

  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImagePlaceholder, { backgroundColor: palette.bg }]}>
          <MaterialCommunityIcons name="food-variant" size={22} color={palette.dot} />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.product_name || item.barcode}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={2}>
          {[item.brand || t('revamp.common.dataSourceOff'), timeStr].join(' · ')}
        </Text>
      </View>

      <Text style={[styles.scoreText, { color: palette.dot }]}>
        {item.overall_score != null ? item.overall_score : '?'}
      </Text>
    </Pressable>
  );
});

export default function HistoryScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { history, isLoading, refresh } = useScanHistory();

  const handleDelete = useCallback((item: ScanHistoryItem) => {
    Alert.alert(
      t('history.deleteTitle'),
      t('history.deleteMessage', { name: item.product_name || item.barcode }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteScanHistoryItem(db, item.id).then(() => refresh());
          },
        },
      ]
    );
  }, [t, db, refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const summary = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0 };
    history.forEach((item) => {
      if (item.overall_rating === 'yellow') counts.yellow += 1;
      else if (item.overall_rating === 'red') counts.red += 1;
      else if (item.overall_rating === 'green') counts.green += 1;
    });
    return counts;
  }, [history]);

  const renderItem = useCallback(({ item }: { item: ScanHistoryItem }) => (
    <HistoryCard
      item={item}
      onPress={() =>
        router.push({
          pathname: '/product/[barcode]' as any,
          params: { barcode: item.barcode, source: 'history' },
        })
      }
      onLongPress={() => handleDelete(item)}
    />
  ), [handleDelete]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <MaterialCommunityIcons name="history" size={36} color={colors.sage} />
        </View>
        <Text style={styles.emptyTitle}>{t('history.empty')}</Text>
        <Text style={styles.emptyMessage}>{t('history.emptyMessage')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      style={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.warmWhite }]}>
                  <MaterialCommunityIcons name="barcode-scan" size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.summaryValue}>{history.length}</Text>
              </View>
              <Text style={styles.summaryLabel}>{t('revamp.history.totalScans')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(91,138,114,0.15)' }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.sage} />
                </View>
                <Text style={[styles.summaryValue, { color: colors.sageDark }]}>{summary.green}</Text>
              </View>
              <Text style={styles.summaryLabel}>{t('revamp.history.lowFodmap')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(199,91,74,0.12)' }]}>
                  <MaterialCommunityIcons name="alert-outline" size={16} color={colors.coral} />
                </View>
                <Text style={[styles.summaryValue, { color: colors.coralDark }]}>{summary.red}</Text>
              </View>
              <Text style={styles.summaryLabel}>{t('revamp.history.highFodmap')}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t('revamp.history.recentProducts')}</Text>
        </>
      }
      ListFooterComponent={<View style={styles.footerSpacer} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cream,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    ...shadows.sm,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.labelLarge,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 24,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardBody: {
    flex: 1,
  },
  productName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  productImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  productImagePlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
  },
  footerSpacer: {
    height: 100,
  },
});

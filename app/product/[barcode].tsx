import { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFodmapAnalysis } from '@/src/hooks/useFodmapAnalysis';
import { addScanHistoryItem, updateScanHistoryOcr, getStoredAnalysis } from '@/src/db/queries';
import { useOcrAnalysis } from '@/src/hooks/useOcrAnalysis';
import { useAppStore } from '@/src/store/appStore';
import { ProductHeader } from '@/src/components/product/ProductHeader';
import { FodmapBreakdown } from '@/src/components/product/FodmapBreakdown';
import { IngredientList } from '@/src/components/product/IngredientList';
import { NutrientLevels } from '@/src/components/product/NutrientLevels';
import { ReintroductionGroups } from '@/src/components/product/ReintroductionGroups';
import { IngredientConfirmSheet } from '@/src/components/product/IngredientConfirmSheet';
import { LoadingState } from '@/src/components/common/LoadingState';
import { ErrorState } from '@/src/components/common/ErrorState';
import type { FodmapAnalysis, FodmapRating, MatchedIngredient } from '@/src/types/fodmap';
import { colors, ratingColors, paletteForRating, typography, spacing, radius, shadows } from '@/src/theme/design';

function summaryForAnalysis(t: (key: string) => string, rating: FodmapRating) {
  if (rating === 'green') {
    return { title: t('revamp.product.greenTitle'), body: t('revamp.product.greenBodyHigh') };
  }
  if (rating === 'yellow') {
    return { title: t('revamp.product.yellowTitle'), body: t('revamp.product.yellowBodyHigh') };
  }
  return { title: t('revamp.product.redTitle'), body: t('revamp.product.redBodyHigh') };
}

function getProductName(product: any) {
  return (
    product.product_name ||
    product.product_name_en ||
    product.product_name_fr ||
    product.product_name_de ||
    'Unknown Product'
  );
}


function ProductInsightHero({
  product,
  analysis,
  isFromOcr,
  showActions,
  onOpenOcr,
  onRescan,
}: {
  product: any;
  analysis: FodmapAnalysis;
  isFromOcr: boolean;
  showActions: boolean;
  onOpenOcr: () => void;
  onRescan: () => void;
}) {
  const { t } = useTranslation();
  const summary = summaryForAnalysis(t, analysis.overallRating);
  const palette = paletteForRating(analysis.overallRating);
  const productName = getProductName(product);
  const brand = product.brands || t('revamp.common.dataSourceOff');
  const imageUrl = product.image_front_url || product.image_url;

  return (
    <View style={styles.insightCard}>
      {/* Image banner */}
      {imageUrl ? (
        <View style={styles.heroBanner}>
          <Image source={{ uri: imageUrl }} style={styles.heroBannerImage} resizeMode="contain" />
        </View>
      ) : (
        <LinearGradient colors={[palette.bg, colors.warmWhite]} style={styles.heroBannerPlaceholder}>
          <MaterialCommunityIcons name="food-variant" size={40} color={palette.dot} />
        </LinearGradient>
      )}

      {/* Product info + score */}
      <View style={styles.heroBody}>
        <View style={styles.heroTitleRow}>
          <View style={styles.heroTitleInfo}>
            <Text style={styles.insightBrand}>{brand}</Text>
            <Text style={styles.insightName} numberOfLines={2}>{productName}</Text>
          </View>
          <Pressable onLongPress={onRescan} style={[styles.insightScoreWrap, { backgroundColor: palette.dot }]}>
            <Text style={styles.insightScore}>{analysis.overallScore}</Text>
          </Pressable>
        </View>

        <View style={styles.insightMetaRow}>
          <View style={[styles.metaChip, { backgroundColor: palette.bg }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={palette.dot} />
            <Text style={[styles.metaChipText, { color: palette.text }]}>{summary.title}</Text>
          </View>
        </View>

        <Text style={styles.insightSummary}>{summary.body}</Text>

        {analysis.appliedOverrides && analysis.appliedOverrides.length > 0 && (
          <View style={styles.overrideNoteRow}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.sage} />
            <Text style={styles.overrideNoteText}>
              {analysis.appliedOverrides.map((o) => t(o.noteKey)).join(' ')}
            </Text>
          </View>
        )}

        {showActions && (
          <View style={styles.heroActionRow}>
            <Pressable style={styles.heroPrimaryAction} onPress={onOpenOcr}>
              <MaterialCommunityIcons name="text-recognition" size={18} color={colors.textOnDark} />
              <Text style={styles.heroPrimaryActionText}>
                {isFromOcr ? t('revamp.product.updateOcrResult') : t('ocr.scanButton')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ProductScreen() {
  const { barcode, source } = useLocalSearchParams<{
    barcode: string;
    source?: 'scan' | 'manual' | 'history';
  }>();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const savedRef = useRef(false);
  const { product, analysis, isLoadingProduct, isAnalyzing, error, productNotFound, noIngredients, refetch } =
    useFodmapAnalysis(barcode ?? '');
  const ocrAnalysis = useAppStore((s) => (barcode ? s.ocrResults[barcode] : undefined));
  const setOcrResult = useAppStore((s) => s.setOcrResult);
  const activeAnalysis = ocrAnalysis ?? analysis;
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const {
    pendingIngredients,
    isParsing: isManualAnalyzing,
    parseOnly,
    scoreConfirmed,
  } = useOcrAnalysis();
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const handleRescan = useCallback(() => {
    Alert.alert(
      t('product.rescanTitle'),
      t('product.rescanMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('product.rescanConfirm'),
          onPress: () => {
            refetch();
            if (barcode && activeAnalysis && activeAnalysis.matchedIngredients.length > 0) {
              updateScanHistoryOcr(db, barcode, activeAnalysis.overallScore, activeAnalysis.overallRating).catch(() => {});
            }
          },
        },
      ]
    );
  }, [t, refetch, barcode, activeAnalysis, db]);

  const handleManualSubmit = useCallback(async () => {
    if (!manualText.trim() || !barcode) return;
    await parseOnly(manualText);
    setShowConfirmSheet(true);
  }, [manualText, barcode, parseOnly]);

  const handleManualConfirm = useCallback(
    (editedIngredients: MatchedIngredient[]) => {
      if (!barcode) return;
      const result = scoreConfirmed(editedIngredients);
      setOcrResult(barcode, result);
      updateScanHistoryOcr(
        db,
        barcode,
        result.overallScore,
        result.overallRating,
        JSON.stringify(result)
      ).catch(() => {});
      setShowConfirmSheet(false);
      setShowManualInput(false);
      setManualText('');
    },
    [barcode, db, scoreConfirmed, setOcrResult]
  );

  // Restore persisted OCR/manual analysis when navigating from history
  useEffect(() => {
    if (!barcode || ocrAnalysis || source !== 'history') return;
    getStoredAnalysis(db, barcode).then((restored) => {
      if (restored) setOcrResult(barcode, restored);
    });
  }, [barcode, db, ocrAnalysis, setOcrResult, source]);

  useEffect(() => {
    const shouldPersistHistory = source === 'scan' || source === 'manual';
    if (product && analysis && shouldPersistHistory && !savedRef.current) {
      savedRef.current = true;
      const name =
        product.product_name ||
        product.product_name_en ||
        product.product_name_fr ||
        product.product_name_de ||
        null;
      const hasIngredients = analysis.matchedIngredients.length > 0;
      addScanHistoryItem(db, {
        barcode: barcode ?? '',
        product_name: name,
        brand: product.brands || null,
        overall_score: hasIngredients ? analysis.overallScore : null,
        overall_rating: hasIngredients ? analysis.overallRating : null,
        scanned_at: new Date().toISOString(),
        product_data: JSON.stringify(product),
        analysis_data: null,
      });
    }
  }, [product, analysis, barcode, db, source]);

  if (isLoadingProduct || isAnalyzing) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (productNotFound) {
    return (
      <View style={styles.centered}>
        <View style={styles.stateIcon}>
          <MaterialCommunityIcons name="barcode-off" size={36} color={colors.amber} />
        </View>
        <Text style={styles.stateTitle}>{t('product.notFound')}</Text>
        <Text style={styles.stateMessage}>{t('product.notFoundMessage')}</Text>
        <Text style={styles.barcode}>{barcode}</Text>
        <Pressable
          style={[styles.primaryAction, { marginTop: spacing.lg }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.textOnDark} />
          <Text style={styles.primaryActionText}>{t('product.backToScan')}</Text>
        </Pressable>
      </View>
    );
  }

  if (!product || !analysis) {
    return <LoadingState />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {noIngredients && !ocrAnalysis ? (
        <>
          <ProductHeader product={product} />
          <View style={styles.unknownCard}>
            <View style={styles.unknownIcon}>
              <MaterialCommunityIcons name="help-circle-outline" size={36} color={colors.amber} />
            </View>
            <Text style={styles.unknownTitle}>{t('product.noIngredients')}</Text>
            <Text style={styles.unknownMessage}>{t('product.noIngredientsMessage')}</Text>

            {showManualInput ? (
              <View style={styles.manualInputWrap}>
                <TextInput
                  style={styles.manualInput}
                  value={manualText}
                  onChangeText={setManualText}
                  placeholder={t('product.ingredientsPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.manualActions}>
                  <Pressable
                    style={[styles.primaryAction, !manualText.trim() && styles.actionDisabled]}
                    onPress={handleManualSubmit}
                    disabled={!manualText.trim() || isManualAnalyzing}
                  >
                    {isManualAnalyzing ? (
                      <ActivityIndicator size="small" color={colors.textOnDark} />
                    ) : (
                      <MaterialCommunityIcons name="check" size={20} color={colors.textOnDark} />
                    )}
                    <Text style={styles.primaryActionText}>{t('product.analyzeIngredients')}</Text>
                  </Pressable>
                  <Pressable style={styles.textAction} onPress={() => { setShowManualInput(false); setManualText(''); }}>
                    <Text style={styles.textActionLabel}>{t('common.cancel')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.noIngredientActions}>
                <Pressable
                  style={styles.primaryAction}
                  onPress={() => router.push({ pathname: '/ocr-scan' as any, params: { barcode } })}
                >
                  <MaterialCommunityIcons name="text-recognition" size={20} color={colors.textOnDark} />
                  <Text style={styles.primaryActionText}>{t('ocr.scanButton')}</Text>
                </Pressable>
                <Pressable style={styles.textAction} onPress={() => setShowManualInput(true)}>
                  <MaterialCommunityIcons name="keyboard-outline" size={18} color={colors.sage} />
                  <Text style={styles.textActionLabel}>{t('product.typeIngredients')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          {activeAnalysis && (
            <View style={styles.mainCard}>
              <ProductInsightHero
                product={product}
                analysis={activeAnalysis}
                isFromOcr={!!ocrAnalysis}
                showActions={!!ocrAnalysis || noIngredients}
                onOpenOcr={() => router.push({ pathname: '/ocr-scan' as any, params: { barcode } })}
                onRescan={handleRescan}
              />
              <FodmapBreakdown analysis={activeAnalysis} embedded />
              {(() => {
                const unknowns = activeAnalysis.matchedIngredients.filter(
                  (m) => m.matchType === 'unknown'
                ).length;
                return unknowns > 0 ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 8 }}>
                    <Icon source="information-outline" size={14} color={colors.textMuted} />
                    <Text variant="bodySmall" style={{ color: colors.textMuted }}>
                      {t('ocr.unknownCount', { count: unknowns })}
                    </Text>
                  </View>
                ) : null;
              })()}
              <ReintroductionGroups analysis={activeAnalysis} embedded />
              <IngredientList ingredients={activeAnalysis.matchedIngredients} embedded />
              <NutrientLevels product={product} embedded />
            </View>
          )}
        </>
      )}

      <View style={styles.disclaimerCard}>
        <MaterialCommunityIcons name="information-outline" size={16} color={colors.amberDark} />
        <Text style={styles.disclaimer}>{t('product.disclaimer')}</Text>
      </View>

      {showConfirmSheet && pendingIngredients && (
        <IngredientConfirmSheet
          key={pendingIngredients.map(i => i.name).join(',')}
          visible={showConfirmSheet}
          ingredients={pendingIngredients}
          onConfirm={handleManualConfirm}
          onRescan={() => setShowConfirmSheet(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cream,
  },
  stateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amberMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stateTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stateMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  barcode: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  unknownCard: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    padding: spacing.xl,
    ...shadows.sm,
  },
  unknownIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.amberMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  unknownTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  unknownMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
  },
  primaryActionText: {
    ...typography.titleMedium,
    color: colors.textOnDark,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  noIngredientActions: {
    alignItems: 'center',
    gap: spacing.md,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  textActionLabel: {
    ...typography.bodyMedium,
    color: colors.sage,
    fontWeight: '600',
  },
  manualInputWrap: {
    width: '100%',
    gap: spacing.md,
  },
  manualInput: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    backgroundColor: colors.warmWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  manualActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 28,
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  insightCard: {
    borderRadius: 28,
  },
  heroBanner: {
    height: 180,
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  heroBody: {
    padding: spacing.lg,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTitleInfo: {
    flex: 1,
  },
  insightBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(31,42,36,0.58)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  insightName: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  insightScoreWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightScore: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textOnDark,
  },
  insightMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metaChipText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  insightSummary: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  overrideNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(107,142,117,0.08)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  overrideNoteText: {
    ...typography.bodySmall,
    color: colors.sage,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  heroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.sageDark,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    flex: 1,
  },
  heroPrimaryActionText: {
    ...typography.bodyMedium,
    color: colors.textOnDark,
    fontWeight: '700',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    backgroundColor: colors.amberMuted,
    borderRadius: 22,
    padding: spacing.md,
  },
  disclaimer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MatchedIngredient } from '@/src/types/fodmap';
import {
  getSuggestions,
  type IngredientSuggestion,
} from '@/src/services/fodmapEngine';
import {
  colors,
  paletteForRating,
  typography,
  spacing,
  radius,
  shadows,
} from '@/src/theme/design';

interface IngredientConfirmSheetProps {
  visible: boolean;
  ingredients: MatchedIngredient[];
  onConfirm: (editedIngredients: MatchedIngredient[]) => void;
  onRescan: () => void;
}

export function IngredientConfirmSheet({
  visible,
  ingredients: initialIngredients,
  onConfirm,
  onRescan,
}: IngredientConfirmSheetProps) {
  const { t } = useTranslation();
  const db = useSQLiteContext();

  const [ingredients, setIngredients] =
    useState<MatchedIngredient[]>(initialIngredients);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  React.useEffect(() => {
    setIngredients(initialIngredients);
    setExpandedIndex(null);
    setSuggestions([]);
  }, [initialIngredients]);

  const allUnknown =
    ingredients.length > 0 &&
    ingredients.every((ing) => ing.matchType === 'unknown');

  const recognizedCount = ingredients.filter(
    (ing) => ing.matchType !== 'unknown'
  ).length;
  const unknownCount = ingredients.length - recognizedCount;
  const matchRatio =
    ingredients.length > 0 ? recognizedCount / ingredients.length : 0;

  const handleChipPress = useCallback(
    async (index: number) => {
      const ing = ingredients[index];
      if (ing.matchType !== 'unknown') return;

      if (expandedIndex === index) {
        setExpandedIndex(null);
        setSuggestions([]);
        return;
      }

      setExpandedIndex(index);
      setLoadingSuggestions(true);
      try {
        const results = await getSuggestions(ing.name, db, 3);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [ingredients, db, expandedIndex]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: IngredientSuggestion) => {
      if (expandedIndex === null) return;
      setIngredients((prev) =>
        prev.map((ing, i) =>
          i === expandedIndex
            ? {
                name: suggestion.synonym,
                fodmapIngredient: suggestion.fodmapIngredient,
                matchType: 'exact' as const,
                confidence: 1.0,
                position: ing.position,
              }
            : ing
        )
      );
      setExpandedIndex(null);
      setSuggestions([]);
    },
    [expandedIndex]
  );

  const handleDelete = useCallback(() => {
    if (expandedIndex === null) return;
    setIngredients((prev) => prev.filter((_, i) => i !== expandedIndex));
    setExpandedIndex(null);
    setSuggestions([]);
  }, [expandedIndex]);

  const handleKeepAsIs = useCallback(() => {
    setExpandedIndex(null);
    setSuggestions([]);
  }, []);

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={styles.modal}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIconCircle}>
              <MaterialCommunityIcons
                name="text-box-check-outline"
                size={22}
                color={colors.sage}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                {t('ocr.confirmTitle')}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t('ocr.confirmFound', { count: ingredients.length })}
                {unknownCount > 0 &&
                  ` · ${unknownCount} ?`}
              </Text>
            </View>
          </View>

          {/* Match ratio bar */}
          {ingredients.length > 0 && !allUnknown && (
            <View style={styles.ratioBarContainer}>
              <View style={styles.ratioBarTrack}>
                <View
                  style={[
                    styles.ratioBarFill,
                    {
                      width: `${Math.round(matchRatio * 100)}%`,
                      backgroundColor:
                        matchRatio >= 0.8
                          ? colors.sage
                          : matchRatio >= 0.5
                            ? colors.amber
                            : colors.coral,
                    },
                  ]}
                />
              </View>
              <Text style={styles.ratioLabel}>
                {recognizedCount}/{ingredients.length}
              </Text>
            </View>
          )}
        </View>

        {/* All-unknown warning */}
        {allUnknown ? (
          <View style={styles.warningContainer}>
            <View style={styles.warningIconCircle}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={28}
                color={colors.amber}
              />
            </View>
            <Text style={styles.warningText}>
              {t('ocr.allUnknown')}
            </Text>
          </View>
        ) : (
          /* Ingredient list */
          <ScrollView
            style={styles.ingredientScroll}
            contentContainerStyle={styles.ingredientList}
            showsVerticalScrollIndicator={false}
          >
            {ingredients.map((ing, index) => {
              const isUnknown = ing.matchType === 'unknown';
              const isExpanded = expandedIndex === index;
              const chipColors = isUnknown
                ? { bg: colors.amberMuted, text: colors.amberDark }
                : paletteForRating(
                    ing.fodmapIngredient?.overall_rating ?? null
                  );

              return (
                <View key={`${ing.name}-${index}`}>
                  {/* Ingredient pill */}
                  <Pressable
                    onPress={
                      isUnknown ? () => handleChipPress(index) : undefined
                    }
                    style={({ pressed }) => [
                      styles.ingredientPill,
                      { backgroundColor: chipColors.bg },
                      isExpanded && styles.ingredientPillExpanded,
                      isUnknown && !isExpanded && styles.ingredientPillUnknown,
                      pressed && isUnknown && { opacity: 0.8 },
                    ]}
                  >
                    {isUnknown && (
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'help-circle-outline'}
                        size={16}
                        color={colors.amberDark}
                      />
                    )}
                    <Text
                      style={[
                        styles.ingredientName,
                        { color: chipColors.text },
                      ]}
                    >
                      {ing.name}
                    </Text>
                    {isUnknown && !isExpanded && (
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={14}
                        color={colors.amberDark}
                        style={{ opacity: 0.6 }}
                      />
                    )}
                  </Pressable>

                  {/* Expanded action panel */}
                  {isExpanded && (
                    <View style={styles.actionPanel}>
                      {loadingSuggestions ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator
                            size="small"
                            color={colors.sage}
                          />
                        </View>
                      ) : (
                        <>
                          {/* Suggestions as selectable pills */}
                          {suggestions.length > 0 && (
                            <View style={styles.suggestionsSection}>
                              {suggestions.map((s) => {
                                const sugPalette = paletteForRating(
                                  s.fodmapIngredient?.overall_rating ?? null
                                );
                                return (
                                  <Pressable
                                    key={s.synonym}
                                    onPress={() =>
                                      handleSelectSuggestion(s)
                                    }
                                    style={({ pressed }) => [
                                      styles.suggestionPill,
                                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.suggestionAccent,
                                        { backgroundColor: sugPalette.dot },
                                      ]}
                                    />
                                    <Text style={styles.suggestionName}>
                                      {s.synonym}
                                    </Text>
                                    <View style={styles.suggestionUseBadge}>
                                      <MaterialCommunityIcons
                                        name="check"
                                        size={13}
                                        color={colors.sage}
                                      />
                                    </View>
                                  </Pressable>
                                );
                              })}
                            </View>
                          )}

                          {/* Actions */}
                          <View style={styles.actionRow}>
                            <Pressable
                              onPress={handleKeepAsIs}
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.actionBtnKeep,
                                pressed && { opacity: 0.7 },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="eye-off-outline"
                                size={14}
                                color={colors.textMuted}
                              />
                              <Text style={styles.actionBtnKeepText}>
                                {t('ocr.keepAsIs')}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={handleDelete}
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.actionBtnDelete,
                                pressed && { opacity: 0.7 },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={14}
                                color={colors.coralDark}
                              />
                              <Text style={styles.actionBtnDeleteText}>
                                {t('ocr.deleteIngredient')}
                              </Text>
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            onPress={onRescan}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnSecondary,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="camera-retake-outline"
              size={18}
              color={colors.sage}
            />
            <Text style={styles.footerBtnSecondaryText}>
              {t('ocr.rescanBtn')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onConfirm(ingredients)}
            disabled={ingredients.length === 0}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnPrimary,
              pressed && { opacity: 0.85 },
              ingredients.length === 0 && { opacity: 0.4 },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color={colors.textOnDark}
            />
            <Text style={styles.footerBtnPrimaryText}>
              {t('ocr.confirmBtn')}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 0,
    marginBottom: 0,
    marginTop: 'auto',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
    ...shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginTop: spacing.sm + 4,
    marginBottom: spacing.xs,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Match ratio bar
  ratioBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ratioBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  ratioBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratioLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },

  // Warning
  warningContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  warningIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amberMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Ingredient list
  ingredientScroll: {
    flexGrow: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  ingredientList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  // Ingredient pill
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.full,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  ingredientPillUnknown: {
    borderWidth: 1.5,
    borderColor: colors.amberLight,
    borderStyle: 'dashed',
  },
  ingredientPillExpanded: {
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderStyle: 'solid',
  },
  ingredientName: {
    ...typography.bodySmall,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Action panel (expanded dropdown)
  actionPanel: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    marginTop: -2,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.sm,
  },
  loadingRow: {
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },

  // Suggestions as compact pills
  suggestionsSection: {
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: radius.sm + 2,
    paddingVertical: spacing.xs + 2,
    paddingLeft: 0,
    paddingRight: spacing.sm,
    overflow: 'hidden',
  },
  suggestionAccent: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: radius.sm + 2,
    borderBottomLeftRadius: radius.sm + 2,
    marginRight: spacing.sm,
    minHeight: 32,
  },
  suggestionName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textTransform: 'capitalize',
  },
  suggestionUseBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
  },
  actionBtnKeep: {
    backgroundColor: colors.borderLight,
  },
  actionBtnKeepText: {
    ...typography.labelSmall,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'none',
  },
  actionBtnDelete: {
    backgroundColor: colors.coralMuted,
  },
  actionBtnDeleteText: {
    ...typography.labelSmall,
    fontWeight: '600',
    color: colors.coralDark,
    textTransform: 'none',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  footerBtnSecondary: {
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
  footerBtnSecondaryText: {
    ...typography.titleMedium,
    color: colors.sage,
  },
  footerBtnPrimary: {
    backgroundColor: colors.sage,
  },
  footerBtnPrimaryText: {
    ...typography.titleMedium,
    color: colors.textOnDark,
  },
});

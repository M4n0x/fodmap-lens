import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Chip,
  Button,
  Menu,
  useTheme,
} from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import type { MatchedIngredient } from '@/src/types/fodmap';
import {
  getSuggestions,
  type IngredientSuggestion,
} from '@/src/services/fodmapEngine';

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
  const theme = useTheme();
  const db = useSQLiteContext();

  const [ingredients, setIngredients] =
    useState<MatchedIngredient[]>(initialIngredients);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Sync state when parent provides new ingredients (use key prop on parent for clean remount)
  React.useEffect(() => {
    setIngredients(initialIngredients);
    setMenuIndex(null);
    setSuggestions([]);
  }, [initialIngredients]);

  const allUnknown =
    ingredients.length > 0 &&
    ingredients.every((ing) => ing.matchType === 'unknown');

  const unknownCount = ingredients.filter(
    (ing) => ing.matchType === 'unknown'
  ).length;

  const handleChipPress = useCallback(
    async (index: number) => {
      const ing = ingredients[index];
      if (ing.matchType !== 'unknown') return; // only unknown chips are interactive

      setMenuIndex(index);
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
    [ingredients, db]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: IngredientSuggestion) => {
      if (menuIndex === null) return;
      setIngredients((prev) =>
        prev.map((ing, i) =>
          i === menuIndex
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
      setMenuIndex(null);
      setSuggestions([]);
    },
    [menuIndex]
  );

  const handleDelete = useCallback(() => {
    if (menuIndex === null) return;
    setIngredients((prev) => prev.filter((_, i) => i !== menuIndex));
    setMenuIndex(null);
    setSuggestions([]);
  }, [menuIndex]);

  const handleKeepAsIs = useCallback(() => {
    setMenuIndex(null);
    setSuggestions([]);
  }, []);

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleMedium">{t('ocr.confirmTitle')}</Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t('ocr.confirmFound', { count: ingredients.length })}
            {unknownCount > 0 && ` · ${unknownCount} ?`}
          </Text>
        </View>

        {/* All-unknown warning */}
        {allUnknown ? (
          <View style={styles.warningContainer}>
            <Text style={{ color: theme.colors.error }}>
              {t('ocr.allUnknown')}
            </Text>
          </View>
        ) : (
          /* Ingredient chips */
          <ScrollView
            style={styles.chipScroll}
            contentContainerStyle={styles.chipContainer}
          >
            {ingredients.map((ing, index) => {
              const isUnknown = ing.matchType === 'unknown';
              return (
                <Menu
                  key={`${ing.name}-${index}`}
                  visible={menuIndex === index}
                  onDismiss={handleKeepAsIs}
                  anchor={
                    <Chip
                      style={[
                        styles.chip,
                        isUnknown && {
                          backgroundColor: theme.colors.errorContainer,
                        },
                      ]}
                      textStyle={
                        isUnknown
                          ? { color: theme.colors.onErrorContainer }
                          : undefined
                      }
                      icon={isUnknown ? 'help-circle-outline' : undefined}
                      onPress={isUnknown ? () => handleChipPress(index) : undefined}
                      disabled={!isUnknown}
                    >
                      {ing.name}
                    </Chip>
                  }
                >
                  {loadingSuggestions ? (
                    <Menu.Item title="..." disabled />
                  ) : (
                    <>
                      {suggestions.map((s) => (
                        <Menu.Item
                          key={s.synonym}
                          title={s.synonym}
                          leadingIcon="swap-horizontal"
                          onPress={() => handleSelectSuggestion(s)}
                        />
                      ))}
                      <Menu.Item
                        title={t('ocr.deleteIngredient')}
                        leadingIcon="delete-outline"
                        onPress={handleDelete}
                      />
                      <Menu.Item
                        title={t('ocr.keepAsIs')}
                        leadingIcon="check"
                        onPress={handleKeepAsIs}
                      />
                    </>
                  )}
                </Menu>
              );
            })}
          </ScrollView>
        )}

        {/* Footer buttons */}
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Button mode="outlined" onPress={onRescan} style={styles.footerBtn}>
            {t('ocr.rescanBtn')}
          </Button>
          <Button
            mode="contained"
            onPress={() => onConfirm(ingredients)}
            style={styles.footerBtn}
            disabled={ingredients.length === 0}
          >
            {t('ocr.confirmBtn')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 16,
    marginTop: 'auto',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  header: {
    marginBottom: 12,
  },
  warningContainer: {
    padding: 16,
    alignItems: 'center',
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flex: 1,
  },
});

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { StyleSheet, View, FlatList, Pressable, ScrollView, Platform, TextInput } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { onTabRepress } from '@/src/utils/tabEvents';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { searchIngredients, searchIngredientsByGroup } from '@/src/db/queries';
import { TrafficLight } from '@/src/components/common/TrafficLight';
import { FODMAP_CATEGORIES, FODMAP_GROUPS } from '@/src/types/fodmap';
import type { FodmapIngredient, FodmapGroupKey, FodmapRating } from '@/src/types/fodmap';
import { colors, ratingColors, paletteForRating, typography, spacing, radius, shadows } from '@/src/theme/design';

type SearchResult = FodmapIngredient & { matched_synonym: string };

const quickTerms = ['garlic', 'lactose', 'honey', 'cashew', 'mushroom', 'apple'];

const SearchResultCard = memo(function SearchResultCard({ item }: { item: SearchResult }) {
  const { t } = useTranslation();
  const palette = paletteForRating(item.overall_rating);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.name}>{item.matched_synonym}</Text>
          <Text style={styles.subtleLabel}>{item.canonical_key.replace(/_/g, ' ')}</Text>
        </View>
        <View style={[styles.scorePill, { backgroundColor: palette.bg }]}>
          <TrafficLight
            rating={item.overall_rating as FodmapRating}
            size="sm"
            showBadge
            label={t(`product.ratings.${item.overall_rating}`)}
          />
        </View>
      </View>

      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

      <View style={styles.categoryWrap}>
        {FODMAP_CATEGORIES.map((cat) => {
          const rating = item[cat] as FodmapRating;
          if (rating === 'green') return null;
          return (
            <View key={cat} style={[styles.categoryChip, { backgroundColor: paletteForRating(rating).bg }]}>
              <Text style={[styles.categoryText, { color: paletteForRating(rating).text }]}>
                {t(`product.categories.${cat}`)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color={item.confidence >= 0.8 ? colors.sage : item.confidence >= 0.6 ? colors.amber : colors.coral} />
          <Text style={styles.footerText}>{Math.round(item.confidence * 100)}% {t('search.confidence')}</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="database-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerText}>{item.source}</Text>
        </View>
      </View>
    </View>
  );
});

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeGroup, setActiveGroup] = useState<FodmapGroupKey | null>(null);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    return onTabRepress('search', () => {
      searchRef.current?.focus();
    });
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      setActiveGroup(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (text.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        const lang = i18n.language.substring(0, 2);
        const items = await searchIngredients(db, text, lang);
        setResults(items);
        setHasSearched(true);
      }, 300);
    },
    [db, i18n.language]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleGroupFilter = useCallback(
    async (group: FodmapGroupKey) => {
      const isSame = activeGroup === group;
      setActiveGroup(isSame ? null : group);
      if (isSame) {
        setResults([]);
        setHasSearched(false);
        setQuery('');
        return;
      }
      const meta = FODMAP_GROUPS.find((g) => g.key === group)!;
      const lang = i18n.language.substring(0, 2);
      const items = await searchIngredientsByGroup(db, meta.categories, lang);
      setResults(items);
      setHasSearched(true);
      setQuery('');
    },
    [db, i18n.language, activeGroup]
  );

  const summary = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0 };
    results.forEach((item) => {
      counts[item.overall_rating as FodmapRating] += 1;
    });
    return counts;
  }, [results]);

  const renderItem = useCallback(({ item }: { item: SearchResult }) => (
    <SearchResultCard item={item} />
  ), []);

  return (
    <FlatList
      data={results}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <Searchbar
            ref={searchRef}
            placeholder={t('search.placeholder')}
            value={query}
            onChangeText={handleSearch}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={colors.textMuted}
            placeholderTextColor={colors.textMuted}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
            {FODMAP_GROUPS.map((g) => {
              const isActive = activeGroup === g.key;
              return (
                <Pressable
                  key={g.key}
                  style={[styles.groupChip, isActive && styles.groupChipActive]}
                  onPress={() => void handleGroupFilter(g.key)}
                >
                  <MaterialCommunityIcons
                    name={g.icon}
                    size={16}
                    color={isActive ? colors.cardBg : colors.textSecondary}
                  />
                  <Text style={[styles.groupChipText, isActive && styles.groupChipTextActive]}>
                    {t(g.label)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!hasSearched && (
            <>
              <Text style={styles.sectionLabel}>{t('revamp.search.quickStarts')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTermRow}>
                {quickTerms.map((term) => (
                  <Pressable key={term} style={styles.quickTerm} onPress={() => void handleSearch(term)}>
                    <Text style={styles.quickTermText}>{term}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.helperRow}>
                <View style={[styles.helperCard, styles.helperCardCoral]}>
                  <View style={styles.helperIconWrap}>
                    <MaterialCommunityIcons name="traffic-light-outline" size={18} color={colors.coral} />
                  </View>
                  <Text style={styles.helperTitle}>{t('revamp.search.helperTriggerTitle')}</Text>
                  <Text style={styles.helperText}>{t('revamp.search.helperTriggerText')}</Text>
                </View>
                <View style={[styles.helperCard, styles.helperCardSage]}>
                  <View style={styles.helperIconWrap}>
                    <MaterialCommunityIcons name="scale-balance" size={18} color={colors.sage} />
                  </View>
                  <Text style={styles.helperTitle}>{t('revamp.search.helperServingTitle')}</Text>
                  <Text style={styles.helperText}>{t('revamp.search.helperServingText')}</Text>
                </View>
              </View>
            </>
          )}

          {hasSearched && (
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionLabel}>{t('revamp.search.resultsCount', { count: results.length })}</Text>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryChip, { backgroundColor: ratingColors.green.bg }]}>
                  <Text style={[styles.summaryChipText, { color: ratingColors.green.text }]}>
                    {t('revamp.search.lowCount', { count: summary.green })}
                  </Text>
                </View>
                <View style={[styles.summaryChip, { backgroundColor: ratingColors.yellow.bg }]}>
                  <Text style={[styles.summaryChipText, { color: ratingColors.yellow.text }]}>
                    {t('revamp.search.moderateCount', { count: summary.yellow })}
                  </Text>
                </View>
                <View style={[styles.summaryChip, { backgroundColor: ratingColors.red.bg }]}>
                  <Text style={[styles.summaryChipText, { color: ratingColors.red.text }]}>
                    {t('revamp.search.highCount', { count: summary.red })}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {hasSearched && results.length === 0 && (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="food-apple-outline" size={36} color={colors.sage} />
              </View>
              <Text style={styles.emptyTitle}>{t('search.noResults')}</Text>
              <Text style={styles.emptyMessage}>{t('search.noResultsMessage')}</Text>
            </View>
          )}
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
  list: {
    padding: spacing.md,
  },
  searchBar: {
    marginBottom: spacing.md,
    backgroundColor: colors.cardBg,
    borderRadius: radius.full,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInput: {
    ...typography.bodyMedium,
  },
  sectionLabel: {
    ...typography.labelLarge,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  groupChipActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  groupChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  groupChipTextActive: {
    color: colors.cardBg,
  },
  quickTermRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  quickTerm: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickTermText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  helperRow: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  helperCard: {
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.sm,
  },
  helperCardCoral: {
    borderTopWidth: 3,
    borderTopColor: colors.coralLight,
  },
  helperCardSage: {
    borderTopWidth: 3,
    borderTopColor: colors.sageLight,
  },
  helperIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  helperText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  resultsHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  summaryChipText: {
    ...typography.labelSmall,
  },
  card: {
    backgroundColor: Platform.OS === 'android' ? colors.cardBg : 'rgba(255,253,252,0.92)',
    borderRadius: 22,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardTitleWrap: {
    flex: 1,
  },
  name: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  subtleLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  scorePill: {
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  notes: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  categoryChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  categoryText: {
    ...typography.labelSmall,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    marginTop: spacing.sm,
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
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerSpacer: {
    height: 100,
  },
});

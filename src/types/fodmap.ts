export type FodmapRating = 'green' | 'yellow' | 'red';

export type FodmapCategory =
  | 'fructans'
  | 'gos'
  | 'lactose'
  | 'excess_fructose'
  | 'sorbitol'
  | 'mannitol';

export const FODMAP_CATEGORIES: FodmapCategory[] = [
  'fructans',
  'gos',
  'lactose',
  'excess_fructose',
  'sorbitol',
  'mannitol',
];

export type FodmapGroupKey = 'O' | 'D' | 'M' | 'P';

export interface FodmapGroup {
  key: FodmapGroupKey;
  label: string;
  icon: string;
  categories: FodmapCategory[];
}

export const FODMAP_GROUPS: FodmapGroup[] = [
  { key: 'O', label: 'search.groupO', icon: 'grain', categories: ['fructans', 'gos'] },
  { key: 'D', label: 'search.groupD', icon: 'cow', categories: ['lactose'] },
  { key: 'M', label: 'search.groupM', icon: 'fruit-cherries', categories: ['excess_fructose'] },
  { key: 'P', label: 'search.groupP', icon: 'mushroom-outline', categories: ['sorbitol', 'mannitol'] },
];

export const CATEGORY_WEIGHTS: Record<FodmapCategory, number> = {
  fructans: 0.25,
  gos: 0.15,
  lactose: 0.20,
  excess_fructose: 0.18,
  sorbitol: 0.12,
  mannitol: 0.10,
};

export interface FodmapIngredient {
  id: number;
  canonical_key: string;
  category: string | null;
  fructans: FodmapRating;
  gos: FodmapRating;
  lactose: FodmapRating;
  excess_fructose: FodmapRating;
  sorbitol: FodmapRating;
  mannitol: FodmapRating;
  overall_rating: FodmapRating;
  notes: string | null;
  source: string;
  confidence: number;
  updated_at: string;
}

export interface IngredientSynonym {
  id: number;
  fodmap_ingredient_id: number;
  synonym: string;
  language: string;
  is_primary: number;
}

export interface MatchedIngredient {
  name: string;
  fodmapIngredient: FodmapIngredient | null;
  matchType: 'off_id' | 'exact' | 'partial' | 'fuzzy' | 'compound' | 'unknown';
  confidence: number;
  position: number;
}

export interface CategoryOverrideInfo {
  category: FodmapCategory;
  originalRating: FodmapRating;
  newRating: FodmapRating;
  /** i18n key — short label for the breakdown row (e.g. "Aged cheese") */
  reasonKey: string;
  /** i18n key — longer note shown below the product description */
  noteKey: string;
}

export interface FodmapAnalysis {
  categories: Record<FodmapCategory, {
    rating: FodmapRating;
    triggerIngredients: string[];
  }>;
  overallScore: number;
  overallRating: FodmapRating;
  matchedIngredients: MatchedIngredient[];
  matchRate: number;
  /** Product-level overrides applied based on OFF category tags */
  appliedOverrides?: CategoryOverrideInfo[];
}

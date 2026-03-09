import type {
  FodmapRating,
  FodmapCategory,
  FodmapAnalysis,
  CategoryOverrideInfo,
} from '@/src/types/fodmap';
import { FODMAP_CATEGORIES, CATEGORY_WEIGHTS } from '@/src/types/fodmap';

const RATING_VALUES: Record<FodmapRating, number> = {
  green: 0,
  yellow: 50,
  red: 100,
};

interface CategoryOverrideRule {
  /** OFF category tags that trigger this override (any match) */
  categoryTags?: string[];
  /** OFF label tags that trigger this override (any match) */
  labelTags?: string[];
  /** FODMAP categories to override with new ratings */
  overrides: Partial<Record<FodmapCategory, FodmapRating>>;
  /** i18n key — short label for the breakdown row */
  reasonKey: string;
  /** i18n key — longer note shown below the product description */
  noteKey: string;
}

const CATEGORY_OVERRIDE_RULES: CategoryOverrideRule[] = [
  {
    // Hard/aged cheeses: lactose broken down during aging (7,240 products)
    categoryTags: ['en:hard-cheeses'],
    overrides: { lactose: 'green' },
    reasonKey: 'product.override.hardCheeseLabel',
    noteKey: 'product.override.hardCheeseNote',
  },
  {
    // Butter: churning separates lactose, negligible amount (5,625 products)
    categoryTags: ['en:butters'],
    overrides: { lactose: 'green' },
    reasonKey: 'product.override.butterLabel',
    noteKey: 'product.override.butterNote',
  },
  {
    // Ghee/clarified butter: all milk solids removed (220 products)
    categoryTags: ['en:ghee', 'en:clarified-butters'],
    overrides: { lactose: 'green' },
    reasonKey: 'product.override.gheeLabel',
    noteKey: 'product.override.gheeNote',
  },
  {
    // Soy sauce: fermentation breaks down fructans & GOS (2,375 products)
    categoryTags: ['en:soy-sauces'],
    overrides: { fructans: 'green', gos: 'green' },
    reasonKey: 'product.override.soySauceLabel',
    noteKey: 'product.override.soySauceNote',
  },
  {
    // Tempeh: fermentation breaks down fructans & GOS (247 products)
    categoryTags: ['en:tempeh'],
    overrides: { fructans: 'green', gos: 'green' },
    reasonKey: 'product.override.tempehLabel',
    noteKey: 'product.override.tempehNote',
  },
  {
    // Lactose-free products: 39,574 products via labels_tags
    labelTags: ['en:lactose-free', 'en:no-lactose'],
    overrides: { lactose: 'green' },
    reasonKey: 'product.override.lactoseFreeLabel',
    noteKey: 'product.override.lactoseFreeNote',
  },
];

function ruleMatches(
  rule: CategoryOverrideRule,
  categoriesTags: string[],
  labelsTags: string[]
): boolean {
  if (rule.categoryTags?.some((tag) => categoriesTags.includes(tag))) return true;
  if (rule.labelTags?.some((tag) => labelsTags.includes(tag))) return true;
  return false;
}

/**
 * Apply product-level overrides based on OFF categories_tags and labels_tags.
 * Only downgrades risk (e.g., red→green), never increases it.
 * Recalculates overall score/rating after applying overrides.
 */
export function applyCategoryOverrides(
  analysis: FodmapAnalysis,
  categoriesTags?: string[],
  labelsTags?: string[]
): FodmapAnalysis {
  const cats = categoriesTags ?? [];
  const labels = labelsTags ?? [];
  if (cats.length === 0 && labels.length === 0) return analysis;

  const appliedOverrides: CategoryOverrideInfo[] = [];

  // Deep clone categories
  const categories = { ...analysis.categories };
  for (const cat of FODMAP_CATEGORIES) {
    categories[cat] = { ...categories[cat] };
  }

  for (const rule of CATEGORY_OVERRIDE_RULES) {
    if (!ruleMatches(rule, cats, labels)) continue;

    for (const [cat, newRating] of Object.entries(rule.overrides)) {
      const catKey = cat as FodmapCategory;
      const current = categories[catKey];

      // Only override if it would reduce the risk
      if (RATING_VALUES[current.rating] > RATING_VALUES[newRating]) {
        appliedOverrides.push({
          category: catKey,
          originalRating: current.rating,
          newRating,
          reasonKey: rule.reasonKey,
          noteKey: rule.noteKey,
        });
        categories[catKey] = { rating: newRating, triggerIngredients: [] };
      }
    }
  }

  if (appliedOverrides.length === 0) return analysis;

  // Recalculate overall score from modified categories
  let weightedSum = 0;
  let redCount = 0;
  let hasYellow = false;

  for (const cat of FODMAP_CATEGORIES) {
    const value = RATING_VALUES[categories[cat].rating];
    weightedSum += value * CATEGORY_WEIGHTS[cat];
    if (categories[cat].rating === 'red') redCount++;
    if (categories[cat].rating === 'yellow') hasYellow = true;
  }

  const stackingPenalty = Math.max(0, (redCount - 1) * 5);
  const riskFloor = redCount > 0 ? 65 : hasYellow ? 30 : 0;
  const riskScore = Math.min(100, riskFloor + Math.round(weightedSum * 0.35) + stackingPenalty);
  const overallScore = 100 - riskScore;
  const overallRating: FodmapRating =
    overallScore >= 75 ? 'green' : overallScore >= 40 ? 'yellow' : 'red';

  return {
    ...analysis,
    categories,
    overallScore,
    overallRating,
    appliedOverrides,
  };
}

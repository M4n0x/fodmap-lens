import type { FodmapRating, FodmapCategory, FodmapAnalysis, MatchedIngredient } from '@/src/types/fodmap';
import { FODMAP_CATEGORIES, CATEGORY_WEIGHTS } from '@/src/types/fodmap';

// Internal risk values: green=0 (safe), yellow=50, red=100 (risky)
const RATING_VALUES: Record<FodmapRating, number> = {
  green: 0,
  yellow: 50,
  red: 100,
};

function positionWeight(position: number): number {
  if (position < 3) return 1.0;
  if (position < 6) return 0.7;
  return 0.4;
}

export function calculateAnalysis(
  matchedIngredients: MatchedIngredient[]
): FodmapAnalysis {
  const categories = {} as FodmapAnalysis['categories'];

  for (const cat of FODMAP_CATEGORIES) {
    categories[cat] = { rating: 'green', triggerIngredients: [] };
  }

  // Per-category: worst ingredient determines rating, weighted by position
  for (const matched of matchedIngredients) {
    if (!matched.fodmapIngredient) continue;

    const weight = positionWeight(matched.position);
    const ing = matched.fodmapIngredient;

    for (const cat of FODMAP_CATEGORIES) {
      const rating = ing[cat] as FodmapRating;
      if (rating === 'green') continue;

      const current = categories[cat];
      const currentValue = RATING_VALUES[current.rating];
      const newValue = RATING_VALUES[rating] * weight;

      if (newValue > currentValue) {
        current.rating = newValue > 60 ? 'red' : newValue > 25 ? 'yellow' : 'green';
        current.triggerIngredients = [matched.name];
      } else if (newValue === currentValue && newValue > 0) {
        if (!current.triggerIngredients.includes(matched.name)) {
          current.triggerIngredients.push(matched.name);
        }
      }
    }
  }

  // Calculate internal risk score (0=safe, 100=risky)
  let weightedSum = 0;
  let redCount = 0;

  for (const cat of FODMAP_CATEGORIES) {
    const value = RATING_VALUES[categories[cat].rating];
    weightedSum += value * CATEGORY_WEIGHTS[cat];
    if (categories[cat].rating === 'red') redCount++;
  }

  const stackingPenalty = Math.max(0, (redCount - 1) * 5);
  const riskScore = Math.min(100, Math.round(weightedSum + stackingPenalty));

  // Invert: 100 = best (safe), 0 = worst (high risk)
  const overallScore = 100 - riskScore;

  const overallRating: FodmapRating =
    overallScore >= 75 ? 'green' : overallScore >= 40 ? 'yellow' : 'red';

  const totalIngredients = matchedIngredients.length;
  const matchedCount = matchedIngredients.filter(
    (m) => m.matchType !== 'unknown'
  ).length;
  const matchRate = totalIngredients > 0 ? matchedCount / totalIngredients : 0;

  return {
    categories,
    overallScore,
    overallRating,
    matchedIngredients,
    matchRate,
  };
}

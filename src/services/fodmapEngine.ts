import type { SQLiteDatabase } from 'expo-sqlite';
import Fuse from 'fuse.js';
import type { FodmapIngredient, MatchedIngredient } from '@/src/types/fodmap';
import type { ParsedIngredient } from './ingredientParser';
import { getSearchKeyFromOffId } from './ingredientParser';
import { decomposeCompound, normalizeText } from '@/src/utils/normalize';
import {
  findIngredientBySynonym,
  findIngredientByCanonicalKey,
  findIngredientByPartialMatch,
  getAllSynonyms,
} from '@/src/db/queries';

interface SynonymEntry {
  synonym: string;
  canonical_key: string;
  fodmap_ingredient_id: number;
}

let fuseInstance: Fuse<SynonymEntry> | null = null;
let synonymCache: SynonymEntry[] | null = null;

async function getFuse(db: SQLiteDatabase): Promise<Fuse<SynonymEntry>> {
  if (fuseInstance && synonymCache) return fuseInstance;

  const allSynonyms = await getAllSynonyms(db);
  synonymCache = allSynonyms.map((s) => ({
    synonym: s.synonym,
    canonical_key: s.canonical_key,
    fodmap_ingredient_id: s.fodmap_ingredient_id,
  }));

  fuseInstance = new Fuse(synonymCache, {
    keys: ['synonym'],
    threshold: 0.3,
    includeScore: true,
  });

  return fuseInstance;
}

/**
 * Invalidate the cached Fuse index (e.g., after DB update).
 */
export function invalidateFuseCache(): void {
  fuseInstance = null;
  synonymCache = null;
}

/**
 * Multi-layer ingredient matching:
 * 1. OFF ID match
 * 2. Exact synonym match
 * 3. Partial match (SQL LIKE)
 * 4. Fuzzy match (Fuse.js)
 * 5. Compound decomposition
 * 6. Unknown
 */
export async function matchIngredient(
  db: SQLiteDatabase,
  parsed: ParsedIngredient
): Promise<MatchedIngredient> {
  const base: Omit<MatchedIngredient, 'fodmapIngredient' | 'matchType' | 'confidence'> = {
    name: parsed.text,
    position: parsed.position,
  };

  // 1. OFF ID match
  if (parsed.offId) {
    const searchKey = getSearchKeyFromOffId(parsed.offId);
    const result = await findIngredientBySynonym(db, searchKey);
    if (result) {
      return { ...base, fodmapIngredient: result, matchType: 'off_id', confidence: 1.0 };
    }
  }

  // 2. Exact synonym match
  const exact = await findIngredientBySynonym(db, parsed.text);
  if (exact) {
    return { ...base, fodmapIngredient: exact, matchType: 'exact', confidence: 1.0 };
  }

  // 3. Partial match
  const partial = await findIngredientByPartialMatch(db, parsed.text);
  if (partial) {
    return { ...base, fodmapIngredient: partial, matchType: 'partial', confidence: 0.8 };
  }

  // 4. Fuzzy match (with length ratio guard to prevent "wasser" → "wassermelone")
  const fuse = await getFuse(db);
  const fuseResults = fuse.search(parsed.text);
  if (fuseResults.length > 0 && fuseResults[0].score !== undefined && fuseResults[0].score <= 0.3) {
    const bestMatch = fuseResults[0].item;
    const queryLen = parsed.text.length;
    const matchLen = bestMatch.synonym.length;
    const lenRatio = Math.min(queryLen, matchLen) / Math.max(queryLen, matchLen);
    if (lenRatio >= 0.5) {
      const result = await findIngredientBySynonym(db, bestMatch.synonym);
      if (result) {
        const confidence = 1 - (fuseResults[0].score ?? 0.3);
        return { ...base, fodmapIngredient: result, matchType: 'fuzzy', confidence };
      }
    }
  }

  // 5. Compound decomposition
  const parts = decomposeCompound(parsed.text);
  if (parts.length > 1) {
    for (const part of parts) {
      const partResult = await findIngredientBySynonym(db, part);
      if (partResult) {
        return { ...base, fodmapIngredient: partResult, matchType: 'compound', confidence: 0.6 };
      }
    }
  }

  // 6. Unknown
  return { ...base, fodmapIngredient: null, matchType: 'unknown', confidence: 0 };
}

/**
 * Match all parsed ingredients against the FODMAP database.
 * Pre-warms the Fuse index once, then matches all ingredients in parallel.
 */
export async function matchAllIngredients(
  db: SQLiteDatabase,
  ingredients: ParsedIngredient[]
): Promise<MatchedIngredient[]> {
  // Pre-warm Fuse index so parallel matchIngredient calls don't each trigger it
  await getFuse(db);
  return Promise.all(ingredients.map((ingredient) => matchIngredient(db, ingredient)));
}

export interface IngredientSuggestion {
  synonym: string;
  fodmapIngredient: FodmapIngredient;
}

const SUGGESTION_SCORE_THRESHOLD = 0.5;

export async function getSuggestions(
  text: string,
  db: SQLiteDatabase,
  limit: number = 3
): Promise<IngredientSuggestion[]> {
  if (!text || !db) return [];

  const fuse = await getFuse(db);
  const searchKey = normalizeText(text);
  if (!searchKey) return [];

  const fuseResults = fuse.search(searchKey, { limit: 10 });

  const suggestions: IngredientSuggestion[] = [];
  const seenIngredientIds = new Set<number>();

  for (const result of fuseResults) {
    if (result.score === undefined || result.score > SUGGESTION_SCORE_THRESHOLD)
      continue;

    const entry = result.item as SynonymEntry;
    if (seenIngredientIds.has(entry.fodmap_ingredient_id)) continue;

    const fodmapIngredient = await findIngredientByCanonicalKey(db, entry.canonical_key);
    if (!fodmapIngredient) continue;

    seenIngredientIds.add(entry.fodmap_ingredient_id);
    suggestions.push({ synonym: entry.synonym, fodmapIngredient });

    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

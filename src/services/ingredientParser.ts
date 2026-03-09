import type { OFFProduct, OFFIngredient } from '@/src/types/product';
import { normalizeText, offIdToKey } from '@/src/utils/normalize';

export interface ParsedIngredient {
  text: string;
  offId: string | null;
  position: number;
}

/**
 * Derive an English display name from a structured OFF ingredient.
 * Only uses the OFF ID when it's an en: key; otherwise falls back to the text field.
 */
function ingredientDisplayName(ing: OFFIngredient): string {
  if (ing.id && ing.id.startsWith('en:')) {
    return offIdToKey(ing.id);
  }
  // Non-English ID — use the raw text which may be localized
  return normalizeText(ing.text);
}

/**
 * Extract ingredients from an OFF product response.
 * Prefers the structured ingredients[] array when all IDs are English.
 * Falls back to ingredients_text_en, then other languages.
 */
export function parseIngredients(
  product: OFFProduct,
  language: string
): ParsedIngredient[] {
  if (product.ingredients && product.ingredients.length > 0) {
    // Check how many ingredients have English IDs
    const enCount = product.ingredients.filter(
      (ing) => ing.id && ing.id.startsWith('en:')
    ).length;
    const hasNonEnIds = enCount < product.ingredients.length;

    // If some IDs are non-English and English text is available, prefer parsing that
    if (hasNonEnIds && product.ingredients_text_en) {
      return splitIngredientsText(product.ingredients_text_en);
    }

    return product.ingredients.map((ing: OFFIngredient, idx: number) => ({
      text: ingredientDisplayName(ing),
      offId: ing.id || null,
      position: idx,
    }));
  }

  // Fallback to raw text — prefer English
  const textCandidates = [
    product.ingredients_text_en,
    language === 'fr' ? product.ingredients_text_fr : null,
    language === 'de' ? product.ingredients_text_de : null,
    product.ingredients_text,
    product.ingredients_text_fr,
    product.ingredients_text_de,
  ];

  const rawText = textCandidates.find((t) => t && t.trim().length > 0);
  if (!rawText) return [];

  return splitIngredientsText(rawText);
}

/**
 * Extract the contents of top-level parenthetical/bracket groups from a token.
 * e.g., "Mandelkrokant 5% (Rohzucker, Mandeln)" → ["Rohzucker, Mandeln"]
 */
function extractParenContents(raw: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '(' || ch === '[') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === ')' || ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        results.push(raw.substring(start, i));
        start = -1;
      }
    }
  }

  return results;
}

/**
 * Split a raw ingredients text string into individual ingredients.
 * Handles nested parentheses, commas, semicolons.
 * Sub-ingredients inside parentheses are extracted as separate entries.
 */
export function splitIngredientsText(text: string): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];
  let depth = 0;
  let current = '';
  let position = 0;

  for (const char of text) {
    if (char === '(' || char === '[') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']') {
      depth--;
      current += char;
    } else if ((char === ',' || char === ';') && depth === 0) {
      position = pushWithSubIngredients(current, ingredients, position);
      current = '';
    } else {
      current += char;
    }
  }

  pushWithSubIngredients(current, ingredients, position);
  return ingredients;
}

/**
 * Push a main ingredient and any sub-ingredients from parenthetical content.
 * Returns the next available position index.
 */
function pushWithSubIngredients(
  raw: string,
  ingredients: ParsedIngredient[],
  position: number
): number {
  // Add the main ingredient (normalizeText strips parentheticals)
  const mainText = normalizeText(raw);
  if (mainText) {
    ingredients.push({ text: mainText, offId: null, position });
    position++;
  }

  // Extract and add sub-ingredients from parenthetical groups
  for (const content of extractParenContents(raw)) {
    const subs = content.split(/[,;]/);
    for (const sub of subs) {
      const normalized = normalizeText(sub);
      if (normalized) {
        ingredients.push({ text: normalized, offId: null, position });
        position++;
      }
    }
  }

  return position;
}

/**
 * Convert an OFF ingredient ID to a normalized search key.
 */
export function getSearchKeyFromOffId(offId: string): string {
  return offIdToKey(offId);
}

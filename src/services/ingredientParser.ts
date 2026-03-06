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
 * Split a raw ingredients text string into individual ingredients.
 * Handles nested parentheses, commas, semicolons.
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
      const normalized = normalizeText(current);
      if (normalized) {
        ingredients.push({ text: normalized, offId: null, position });
        position++;
      }
      current = '';
    } else {
      current += char;
    }
  }

  const last = normalizeText(current);
  if (last) {
    ingredients.push({ text: last, offId: null, position });
  }

  return ingredients;
}

/**
 * Convert an OFF ingredient ID to a normalized search key.
 */
export function getSearchKeyFromOffId(offId: string): string {
  return offIdToKey(offId);
}

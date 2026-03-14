/**
 * Extract just the ingredient list from raw OCR text.
 * Handles multi-language labels (EN, FR, DE, IT, ES, NL).
 */

export const INGREDIENT_KEYWORDS = [
  'ingredients',
  'ingredient',
  'zutaten',
  'zutat',
  'ingrédients',
  'ingredients',
  'ingredientes',
  'ingredienti',
  'ingrediënten',
  'inhaltsstoffe',
  'zusammensetzung',
  'composition',
];

const STOP_MARKERS = [
  'may contain',
  'kann enthalten',
  'peut contenir',
  'puede contener',
  'può contenere',
  'kan bevatten',
  'allergen',
  'allergène',
  'allergene',
  'nutrition',
  'nährwert',
  'valeurs nutritives',
  'información nutricional',
  'storage',
  'aufbewahrung',
  'conservation',
  'best before',
  'mindestens haltbar',
  'à consommer',
  'net weight',
  'nettogew',
  'poids net',
  'www.',
  'http',
  '* aus ',
  '* de l',
  '* da ',
  '* from ',
  'kakao:',
  'cacao:',
  'cocoa:',
];

/**
 * Find the ingredient section in OCR text and return just the ingredient list.
 * Falls back to the full text if no keyword is found.
 */
export function extractIngredientText(ocrText: string): string {
  // Join lines to handle line breaks within ingredient list
  const fullText = ocrText.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const lowerText = fullText.toLowerCase();

  // Try to find an ingredient keyword followed by a colon
  let bestStart = -1;

  for (const keyword of INGREDIENT_KEYWORDS) {
    let searchFrom = 0;
    while (searchFrom < lowerText.length) {
      const idx = lowerText.indexOf(keyword, searchFrom);
      if (idx === -1) break;

      // Look for a colon within 3 chars after the keyword
      const afterKeyword = idx + keyword.length;
      const colonIdx = fullText.indexOf(':', afterKeyword);
      if (colonIdx !== -1 && colonIdx <= afterKeyword + 3) {
        // Prefer the first match, but if we have multiple, use the one
        // that produces the longest ingredient list
        if (bestStart === -1) {
          bestStart = colonIdx + 1;
        }
        break;
      }
      searchFrom = idx + 1;
    }
    if (bestStart !== -1) break;
  }

  if (bestStart === -1) {
    // No keyword found — return full text as fallback
    return fullText.trim();
  }

  const ingredientText = fullText.substring(bestStart);

  // Find the end of the ingredient list
  const endIdx = findIngredientEnd(ingredientText);
  return ingredientText.substring(0, endIdx).trim();
}

function findIngredientEnd(text: string): number {
  const lowerText = text.toLowerCase();
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '(' || ch === '[') {
      depth++;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1);
      continue;
    }

    // Period at depth 0 = likely end of ingredient list
    if (ch === '.' && depth === 0) {
      // Skip decimal numbers like "10.5"
      if (i > 0 && /\d/.test(text[i - 1]) && i + 1 < text.length && /\d/.test(text[i + 1])) {
        continue;
      }
      return i;
    }

    // Check stop markers
    const remaining = lowerText.substring(i);
    for (const marker of STOP_MARKERS) {
      if (remaining.startsWith(marker)) {
        // Walk back to trim trailing whitespace/punctuation
        let end = i;
        while (end > 0 && /[\s,;]/.test(text[end - 1])) end--;
        return end > 0 ? end : i;
      }
    }
  }

  return text.length;
}

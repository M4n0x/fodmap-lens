/**
 * Normalize text for ingredient matching:
 * - lowercase
 * - strip accents (NFD decomposition)
 * - remove parentheticals
 * - remove percentages
 * - collapse whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/_/g, '') // strip OFF allergen markers
    .replace(/\*+/g, '') // strip bold/allergen asterisks
    .replace(/\([^)]*\)/g, '') // remove parentheticals
    .replace(/\d+([.,]\d+)?%/g, '') // remove percentages
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split compound ingredient text on common delimiters.
 * e.g., "wheat-rye flour" -> ["wheat", "rye flour"]
 */
export function decomposeCompound(text: string): string[] {
  return text
    .split(/[-–—]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/**
 * Map OFF ingredient IDs (e.g., "en:wheat-flour") to a normalized key.
 */
export function offIdToKey(offId: string): string {
  // Remove language prefix like "en:", "fr:", "de:"
  const withoutLang = offId.replace(/^[a-z]{2}:/, '');
  return withoutLang.replace(/-/g, ' ').toLowerCase().trim();
}

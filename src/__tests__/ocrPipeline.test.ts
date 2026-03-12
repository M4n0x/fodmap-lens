import { splitIngredientsText } from '../services/ingredientParser';
import { normalizeText, decomposeCompound } from '../utils/normalize';
import { extractIngredientText } from '../utils/ocrExtractor';
import { calculateAnalysis } from '../utils/scoring';
import type { MatchedIngredient } from '../types/fodmap';

// Simulated OCR text from the Frey chocolate product photo
const OCR_TEXT_DE = `Dunkle Schokolade mit Mandelsplittern und
Mandelkrokant
Zutaten: Kakaomasse* (Peru), Rohzucker*, Kakaobutter*,
Mandelsplitter* 10%, Mandelkrokant* 5% (Rohzucker, Mandeln).
* aus biologischer Landwirtschaft. Kann enthalten: Soja, Milch, Haselnüsse und andere Nüsse
Kakao: 72% mindestens in der Schokolade.`;

const OCR_TEXT_FR = `Chocolat noir avec éclats d'amandes et nougatine d'amandes
Ingrédients: cacao en pâte* (Pérou), cassonade*, beurre de cacao*, éclats d'amandes* 10%, nougatine d'amandes* 5%
amandes). * de l'agriculture biologique. Peut contenir: soja, lait, noisettes et autres fruits à coque.
Cacao: 72% minimum dans le chocolat.`;

describe('normalizeText', () => {
  it('strips accents', () => {
    expect(normalizeText('éclats d\'amandes')).toBe("eclats d'amandes");
  });

  it('strips allergen markers (underscores)', () => {
    expect(normalizeText('_noisette_')).toBe('noisette');
  });

  it('strips allergen markers (asterisks)', () => {
    expect(normalizeText('Kakaomasse**')).toBe('kakaomasse');
  });

  it('removes parentheticals', () => {
    expect(normalizeText('Kakaomasse* (Peru)')).toBe('kakaomasse');
  });

  it('removes percentages', () => {
    expect(normalizeText('Mandelsplitter* 10%')).toBe('mandelsplitter');
  });

  it('collapses whitespace', () => {
    expect(normalizeText('  rohzucker   extra  ')).toBe('rohzucker extra');
  });

  it('handles combination of all transforms', () => {
    expect(normalizeText('Éclats d\'amandes* 10% (bio)')).toBe("eclats d'amandes");
  });
});

describe('decomposeCompound', () => {
  it('splits hyphenated compounds', () => {
    expect(decomposeCompound('wheat-rye flour')).toEqual(['wheat', 'rye flour']);
  });

  it('splits en-dash compounds', () => {
    expect(decomposeCompound('cocoa–butter')).toEqual(['cocoa', 'butter']);
  });

  it('returns single item for non-compound text', () => {
    expect(decomposeCompound('sugar')).toEqual(['sugar']);
  });

  it('filters out single characters', () => {
    expect(decomposeCompound('a-sugar')).toEqual(['sugar']);
  });
});

describe('extractIngredientText', () => {
  it('extracts German ingredient list from full OCR text', () => {
    const ocrText = `gustativa.
Dunkle Schokolade mit Mandelsplittern und
Mandelkrokant
Zutaten: Kakaomasse* (Peru), Rohzucker*, Kakaobutter*,
Mandelsplitter* 10%, Mandelkrokant* 5% (Rohzucker, Mandeln).
* aus biologischer Landwirtschaft. Kann enthalten: Soja, Milch, Haselnüsse und andere Nüsse
Kakao: 72% mindestens in der Schokolade.`;

    const extracted = extractIngredientText(ocrText);
    expect(extracted).toContain('Kakaomasse');
    expect(extracted).toContain('Rohzucker');
    expect(extracted).toContain('Kakaobutter');
    expect(extracted).toContain('Mandelsplitter');
    expect(extracted).toContain('Mandeln');
    // Should NOT contain surrounding text
    expect(extracted.toLowerCase()).not.toContain('dunkle schokolade');
    expect(extracted.toLowerCase()).not.toContain('kann enthalten');
    expect(extracted.toLowerCase()).not.toContain('biologischer landwirtschaft');
    expect(extracted.toLowerCase()).not.toContain('kakao: 72%');
  });

  it('extracts French ingredient list from full OCR text', () => {
    const ocrText = `Chocolat noir avec éclats d'amandes et nougatine d'amandes
Ingrédients: cacao en pâte* (Pérou), cassonade*, beurre de cacao*, éclats d'amandes* 10%, nougatine d'amandes* 5% (amandes).
* de l'agriculture biologique. Peut contenir: soja, lait, noisettes et autres fruits à coque.
Cacao: 72% minimum dans le chocolat.`;

    const extracted = extractIngredientText(ocrText);
    expect(extracted).toContain('cacao en');
    expect(extracted).toContain('cassonade');
    expect(extracted).toContain('beurre de cacao');
    expect(extracted.toLowerCase()).not.toContain('chocolat noir');
    expect(extracted.toLowerCase()).not.toContain('peut contenir');
    expect(extracted.toLowerCase()).not.toContain('cacao: 72%');
  });

  it('extracts English ingredient list', () => {
    const ocrText = `Milk Chocolate Bar
Ingredients: sugar, cocoa butter, whole milk powder, cocoa mass, soy lecithin, vanilla.
May contain: tree nuts, peanuts.
Net weight: 100g`;

    const extracted = extractIngredientText(ocrText);
    expect(extracted).toContain('sugar');
    expect(extracted).toContain('vanilla');
    expect(extracted.toLowerCase()).not.toContain('milk chocolate bar');
    expect(extracted.toLowerCase()).not.toContain('may contain');
    expect(extracted.toLowerCase()).not.toContain('net weight');
  });

  it('handles text with no ingredient keyword (fallback)', () => {
    const ocrText = 'sugar, flour, salt, butter';
    const extracted = extractIngredientText(ocrText);
    expect(extracted).toBe('sugar, flour, salt, butter');
  });

  it('handles multiline ingredient lists', () => {
    const ocrText = `Zutaten: Weizenmehl,
Zucker, Butter, Eier,
Salz, Hefe.
Allergene: Weizen, Milch, Ei.`;

    const extracted = extractIngredientText(ocrText);
    expect(extracted).toContain('Weizenmehl');
    expect(extracted).toContain('Hefe');
    expect(extracted.toLowerCase()).not.toContain('allergene');
  });

  it('does not stop at decimal points in percentages', () => {
    const ocrText = 'Ingredients: cocoa mass 10.5%, sugar, milk powder 3.2%, vanilla.';
    const extracted = extractIngredientText(ocrText);
    expect(extracted).toContain('10.5%');
    expect(extracted).toContain('3.2%');
    expect(extracted).toContain('vanilla');
  });

  it('stops at footnote markers', () => {
    const ocrText = 'Zutaten: Zucker*, Mehl*, Butter. * aus biologischem Anbau.';
    const extracted = extractIngredientText(ocrText);
    expect(extracted).toContain('Zucker');
    expect(extracted).toContain('Butter');
    expect(extracted.toLowerCase()).not.toContain('biologischem');
  });
});

describe('extractIngredientText → splitIngredientsText (end-to-end)', () => {
  it('full pipeline: OCR German chocolate → parsed ingredients', () => {
    const ocrText = `Dunkle Schokolade mit Mandelsplittern und Mandelkrokant
Zutaten: Kakaomasse* (Peru), Rohzucker*, Kakaobutter*,
Mandelsplitter* 10%, Mandelkrokant* 5% (Rohzucker, Mandeln).
* aus biologischer Landwirtschaft.`;

    const extracted = extractIngredientText(ocrText);
    const ingredients = splitIngredientsText(extracted);

    expect(ingredients.length).toBeGreaterThanOrEqual(4);
    const names = ingredients.map((i) => i.text);
    expect(names).toContain('kakaomasse');
    expect(names).toContain('rohzucker');
    expect(names).toContain('kakaobutter');
    expect(names).toContain('mandelsplitter');
    // Sub-ingredients from parentheses should be extracted
    expect(names).toContain('mandeln');
  });

  it('full pipeline: OCR English milk chocolate → parsed ingredients', () => {
    const ocrText = `Milk Chocolate
Ingredients: sugar, cocoa butter, whole milk powder, cocoa mass, soy lecithin, vanilla.
May contain tree nuts.`;

    const extracted = extractIngredientText(ocrText);
    const ingredients = splitIngredientsText(extracted);

    expect(ingredients.length).toBe(6);
    expect(ingredients[0].text).toBe('sugar');
    expect(ingredients[5].text).toBe('vanilla');
  });
});

describe('splitIngredientsText', () => {
  it('splits comma-separated ingredients', () => {
    const result = splitIngredientsText('sugar, flour, salt');
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('sugar');
    expect(result[1].text).toBe('flour');
    expect(result[2].text).toBe('salt');
  });

  it('splits semicolon-separated ingredients', () => {
    const result = splitIngredientsText('sugar; flour; salt');
    expect(result).toHaveLength(3);
  });

  it('extracts sub-ingredients from parentheses', () => {
    const result = splitIngredientsText('chocolate (cocoa, sugar), milk');
    expect(result).toHaveLength(4);
    expect(result[0].text).toBe('chocolate');
    expect(result[1].text).toBe('cocoa');
    expect(result[2].text).toBe('sugar');
    expect(result[3].text).toBe('milk');
  });

  it('assigns position indices', () => {
    const result = splitIngredientsText('sugar, flour, salt');
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
    expect(result[2].position).toBe(2);
  });

  it('normalizes text (removes percentages, accents, etc.)', () => {
    const result = splitIngredientsText('Kakaomasse* 10%, Rohzucker*, Kakaobutter*');
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('kakaomasse');
    expect(result[1].text).toBe('rohzucker');
    expect(result[2].text).toBe('kakaobutter');
  });

  it('handles empty input', () => {
    const result = splitIngredientsText('');
    expect(result).toHaveLength(0);
  });

  it('handles OCR-like text with noise', () => {
    // Just the ingredient line from the OCR text
    const ingredientLine = 'Kakaomasse* (Peru), Rohzucker*, Kakaobutter*, Mandelsplitter* 10%, Mandelkrokant* 5% (Rohzucker, Mandeln)';
    const result = splitIngredientsText(ingredientLine);
    const names = result.map((i) => i.text);
    expect(names).toContain('kakaomasse');
    expect(names).toContain('peru'); // sub-ingredient from parentheses
    expect(names).toContain('rohzucker');
    expect(names).toContain('kakaobutter');
    expect(names).toContain('mandelsplitter');
    expect(names).toContain('mandelkrokant');
    expect(names).toContain('mandeln'); // sub-ingredient from parentheses
  });

  it('handles French ingredient text', () => {
    const line = "cacao en pâte* (Pérou), cassonade*, beurre de cacao*, éclats d'amandes* 10%";
    const result = splitIngredientsText(line);
    const names = result.map((i) => i.text);
    expect(names).toContain('cacao en pate');
    expect(names).toContain('perou'); // sub-ingredient from parentheses
    expect(names).toContain('cassonade');
    expect(names).toContain('beurre de cacao');
    expect(names).toContain("eclats d'amandes");
  });
});

describe('calculateAnalysis', () => {
  it('returns all-green for safe ingredients', () => {
    const ingredients: MatchedIngredient[] = [
      {
        name: 'rice',
        position: 0,
        fodmapIngredient: {
          id: 1,
          canonical_key: 'rice',
          category: 'grain',
          fructans: 'green',
          gos: 'green',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'green',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
    ];
    const result = calculateAnalysis(ingredients);
    expect(result.overallRating).toBe('green');
    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.matchRate).toBe(1);
  });

  it('returns red for high FODMAP ingredients', () => {
    const ingredients: MatchedIngredient[] = [
      {
        name: 'garlic',
        position: 0,
        fodmapIngredient: {
          id: 2,
          canonical_key: 'garlic',
          category: 'vegetable',
          fructans: 'red',
          gos: 'green',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'red',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
    ];
    const result = calculateAnalysis(ingredients);
    expect(result.categories.fructans.rating).toBe('red');
    expect(result.categories.fructans.triggerIngredients).toContain('garlic');
    // fructans red (100 * 0.25 = 25 risk) → 100-25 = 75 → exactly on green threshold
    expect(result.overallScore).toBeLessThanOrEqual(75);
  });

  it('handles mixed matched and unknown ingredients', () => {
    const ingredients: MatchedIngredient[] = [
      {
        name: 'sugar',
        position: 0,
        fodmapIngredient: {
          id: 3,
          canonical_key: 'sugar',
          category: 'sweetener',
          fructans: 'green',
          gos: 'green',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'green',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
      {
        name: 'kakaomasse',
        position: 1,
        fodmapIngredient: null,
        matchType: 'unknown',
        confidence: 0,
      },
    ];
    const result = calculateAnalysis(ingredients);
    expect(result.matchRate).toBe(0.5);
    expect(result.matchedIngredients).toHaveLength(2);
  });

  it('returns 100/100 for empty matched list (no known triggers)', () => {
    const result = calculateAnalysis([]);
    expect(result.overallScore).toBe(100);
    expect(result.overallRating).toBe('green');
    expect(result.matchRate).toBe(0);
  });

  it('applies stacking penalty for multiple red categories', () => {
    const ingredients: MatchedIngredient[] = [
      {
        name: 'onion',
        position: 0,
        fodmapIngredient: {
          id: 4,
          canonical_key: 'onion',
          category: 'vegetable',
          fructans: 'red',
          gos: 'red',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'red',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
    ];
    const singleRed: MatchedIngredient[] = [
      {
        ...ingredients[0],
        fodmapIngredient: {
          ...ingredients[0].fodmapIngredient!,
          gos: 'green', // only fructans red
        },
      },
    ];
    const multiRed = calculateAnalysis(ingredients);
    const singleRedResult = calculateAnalysis(singleRed);
    // Multi-red should score lower due to stacking penalty
    expect(multiRed.overallScore).toBeLessThan(singleRedResult.overallScore);
  });

  it('more FODMAP triggers produce a worse score than fewer triggers', () => {
    // Barilla-like: single red category (fructans from wheat)
    const barilla: MatchedIngredient[] = [
      {
        name: 'durum wheat semolina',
        position: 0,
        fodmapIngredient: {
          id: 10,
          canonical_key: 'semolina',
          category: 'grains',
          fructans: 'red',
          gos: 'green',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'red',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
    ];

    // Nutella-like: red lactose (milk) + yellow fructans (hazelnuts)
    const nutella: MatchedIngredient[] = [
      {
        name: 'sugar',
        position: 0,
        fodmapIngredient: {
          id: 11,
          canonical_key: 'sugar',
          category: 'sweetener',
          fructans: 'green',
          gos: 'green',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'green',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
      {
        name: 'hazelnuts',
        position: 2,
        fodmapIngredient: {
          id: 12,
          canonical_key: 'hazelnuts',
          category: 'nuts',
          fructans: 'yellow',
          gos: 'green',
          lactose: 'green',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'yellow',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
      {
        name: 'skimmed milk powder',
        position: 3,
        fodmapIngredient: {
          id: 13,
          canonical_key: 'milk',
          category: 'dairy',
          fructans: 'green',
          gos: 'green',
          lactose: 'red',
          excess_fructose: 'green',
          sorbitol: 'green',
          mannitol: 'green',
          overall_rating: 'red',
          notes: null,
          source: 'literature',
          confidence: 1,
          updated_at: '2024-01-01',
        },
        matchType: 'exact',
        confidence: 1,
      },
    ];

    const barillaResult = calculateAnalysis(barilla);
    const nutellaResult = calculateAnalysis(nutella);

    // Both should be red
    expect(barillaResult.overallRating).toBe('red');
    expect(nutellaResult.overallRating).toBe('red');
    // Nutella should score strictly worse (more triggers)
    expect(nutellaResult.overallScore).toBeLessThan(barillaResult.overallScore);
  });

  it('position weighting: later ingredients have less impact', () => {
    const makeIngredient = (pos: number): MatchedIngredient => ({
      name: 'garlic',
      position: pos,
      fodmapIngredient: {
        id: 5,
        canonical_key: 'garlic',
        category: 'vegetable',
        fructans: 'red',
        gos: 'green',
        lactose: 'green',
        excess_fructose: 'green',
        sorbitol: 'green',
        mannitol: 'green',
        overall_rating: 'red',
        notes: null,
        source: 'literature',
        confidence: 1,
        updated_at: '2024-01-01',
      },
      matchType: 'exact',
      confidence: 1,
    });

    const earlyResult = calculateAnalysis([makeIngredient(0)]);
    const lateResult = calculateAnalysis([makeIngredient(8)]);
    // Garlic at position 0 should have more impact (lower score) than at position 8
    expect(earlyResult.overallScore).toBeLessThanOrEqual(lateResult.overallScore);
  });
});

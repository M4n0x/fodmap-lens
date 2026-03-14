import { validateOcrText } from '../ocrValidator';

describe('validateOcrText', () => {
  it('rejects empty text', () => {
    expect(validateOcrText('').valid).toBe(false);
  });

  it('rejects text shorter than MIN_TEXT_LENGTH', () => {
    expect(validateOcrText('abc').valid).toBe(false);
  });

  it('rejects whitespace-only text', () => {
    expect(validateOcrText('   ').valid).toBe(false);
  });

  it('rejects text that is mostly digits (barcode)', () => {
    expect(validateOcrText('8 410076 472618 3 760020 507350').valid).toBe(false);
  });

  it('rejects long text with no separators and no keywords', () => {
    const nutrition = 'Nährwerte pro 100g Energie 1520kJ Fett 12g davon gesättigte 5g';
    expect(validateOcrText(nutrition).valid).toBe(false);
  });

  it('accepts valid English ingredient list', () => {
    expect(validateOcrText('Ingredients: wheat flour, sugar, salt, milk powder').valid).toBe(true);
  });

  it('accepts valid German ingredient list', () => {
    expect(validateOcrText('Zutaten: Weizenmehl, Zucker, Salz, Milchpulver').valid).toBe(true);
  });

  it('accepts valid French ingredient list', () => {
    expect(validateOcrText('Ingrédients: farine de blé, sucre, sel, lait en poudre').valid).toBe(true);
  });

  it('accepts text with keyword but no commas if short enough', () => {
    expect(validateOcrText('ingredients: sugar').valid).toBe(true);
  });

  it('passes text with only 1 heuristic failure', () => {
    expect(validateOcrText('wheat flour, sugar, salt, milk powder, cocoa butter').valid).toBe(true);
  });

  it('returns reason when invalid', () => {
    const result = validateOcrText('12345');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });
});

import { INGREDIENT_KEYWORDS } from '@/src/utils/ocrExtractor';

export const MIN_TEXT_LENGTH = 10;
export const MAX_DIGIT_RATIO = 0.6;
export const MIN_TEXT_FOR_SEPARATOR_CHECK = 30;
export const FAILURE_THRESHOLD = 2;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateOcrText(text: string): ValidationResult {
  const trimmed = text.trim();
  const failures: string[] = [];

  if (trimmed.length < MIN_TEXT_LENGTH) {
    failures.push('text_too_short');
  }

  if (trimmed.length > 0) {
    const digitCount = (trimmed.match(/\d/g) || []).length;
    if (digitCount / trimmed.length > MAX_DIGIT_RATIO) {
      failures.push('mostly_digits');
    }
  }

  const lowerText = trimmed.toLowerCase();
  const hasKeyword = INGREDIENT_KEYWORDS.some((kw) =>
    lowerText.includes(kw.toLowerCase())
  );
  if (!hasKeyword) {
    failures.push('no_ingredient_keyword');
  }

  if (trimmed.length > MIN_TEXT_FOR_SEPARATOR_CHECK) {
    const hasSeparators = /[,;]/.test(trimmed);
    if (!hasSeparators) {
      failures.push('no_separators');
    }
  }

  if (failures.length >= FAILURE_THRESHOLD) {
    return { valid: false, reason: failures.join(', ') };
  }

  return { valid: true };
}

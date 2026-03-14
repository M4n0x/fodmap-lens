import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { extractIngredientText } from '@/src/utils/ocrExtractor';
import { splitIngredientsText } from '@/src/services/ingredientParser';
import { matchAllIngredients } from '@/src/services/fodmapEngine';
import { calculateAnalysis } from '@/src/utils/scoring';
import type { MatchedIngredient, FodmapAnalysis } from '@/src/types/fodmap';

export function useOcrAnalysis() {
  const db = useSQLiteContext();
  const [pendingIngredients, setPendingIngredients] =
    useState<MatchedIngredient[] | null>(null);
  const [analysis, setAnalysis] = useState<FodmapAnalysis | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  const parseOnly = useCallback(
    async (rawText: string): Promise<MatchedIngredient[]> => {
      setIsParsing(true);
      setParseError(null);
      setAnalysis(null);
      try {
        const ingredientText = extractIngredientText(rawText);
        setExtractedText(ingredientText);
        const parsed = splitIngredientsText(ingredientText);
        if (parsed.length === 0) {
          setParseError('no_ingredients');
          return [];
        }
        const matched = await matchAllIngredients(db, parsed);
        setPendingIngredients(matched);
        return matched;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Parse failed';
        setParseError(msg);
        return [];
      } finally {
        setIsParsing(false);
      }
    },
    [db]
  );

  const scoreConfirmed = useCallback(
    (ingredients: MatchedIngredient[]): FodmapAnalysis => {
      const result = calculateAnalysis(ingredients);
      setAnalysis(result);
      setPendingIngredients(null);
      return result;
    },
    []
  );

  // Backward-compatible one-shot: parse + score in one call
  const analyze = useCallback(
    async (rawText: string): Promise<FodmapAnalysis | null> => {
      const matched = await parseOnly(rawText);
      if (matched.length === 0) return null;
      return scoreConfirmed(matched);
    },
    [parseOnly, scoreConfirmed]
  );

  const reset = useCallback(() => {
    setPendingIngredients(null);
    setAnalysis(null);
    setIsParsing(false);
    setParseError(null);
    setExtractedText(null);
  }, []);

  return {
    // New API
    pendingIngredients,
    isParsing,
    parseError,
    parseOnly,
    scoreConfirmed,
    // Backward-compatible aliases
    isAnalyzing: isParsing,
    error: parseError,
    // Shared
    analysis,
    extractedText,
    analyze,
    reset,
  };
}

import { useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { splitIngredientsText } from '@/src/services/ingredientParser';
import { matchAllIngredients } from '@/src/services/fodmapEngine';
import { calculateAnalysis } from '@/src/utils/scoring';
import { extractIngredientText } from '@/src/utils/ocrExtractor';
import type { FodmapAnalysis } from '@/src/types/fodmap';

interface UseOcrAnalysisResult {
  analysis: FodmapAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  extractedText: string;
  analyze: (rawText: string) => Promise<FodmapAnalysis | null>;
  reset: () => void;
}

export function useOcrAnalysis(): UseOcrAnalysisResult {
  const db = useSQLiteContext();
  const [analysis, setAnalysis] = useState<FodmapAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');

  const analyze = useCallback(async (rawText: string): Promise<FodmapAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      // Extract just the ingredient portion from OCR text
      const ingredientText = extractIngredientText(rawText);
      setExtractedText(ingredientText);

      const parsed = splitIngredientsText(ingredientText);
      if (parsed.length === 0) {
        setError('no_ingredients');
        return null;
      }
      const matched = await matchAllIngredients(db, parsed);
      const result = calculateAnalysis(matched);
      setAnalysis(result);
      return result;
    } catch (err) {
      console.error('OCR analysis error:', err);
      setError('analysis_failed');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [db]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setExtractedText('');
    setIsAnalyzing(false);
  }, []);

  return { analysis, isAnalyzing, error, extractedText, analyze, reset };
}

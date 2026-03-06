import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useProductLookup } from './useProductLookup';
import { parseIngredients } from '@/src/services/ingredientParser';
import { matchAllIngredients } from '@/src/services/fodmapEngine';
import { calculateAnalysis } from '@/src/utils/scoring';
import { useAppStore } from '@/src/store/appStore';
import type { FodmapAnalysis } from '@/src/types/fodmap';
import type { OFFProduct } from '@/src/types/product';

interface UseFodmapAnalysisResult {
  product: OFFProduct | null | undefined;
  analysis: FodmapAnalysis | null;
  isLoadingProduct: boolean;
  isAnalyzing: boolean;
  error: Error | null;
  productNotFound: boolean;
  noIngredients: boolean;
}

export function useFodmapAnalysis(barcode: string): UseFodmapAnalysisResult {
  const db = useSQLiteContext();
  const language = useAppStore((s) => s.language);
  const { data: product, isLoading: isLoadingProduct, error } = useProductLookup(barcode);
  const [analysis, setAnalysis] = useState<FodmapAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!product) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;

    async function analyze() {
      setIsAnalyzing(true);
      try {
        const parsed = parseIngredients(product!, language);
        const matched = await matchAllIngredients(db, parsed);
        const result = calculateAnalysis(matched);
        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (err) {
        console.error('FODMAP analysis error:', err);
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    analyze();
    return () => {
      cancelled = true;
    };
  }, [product, db, language]);

  const noIngredients = !isLoadingProduct && !isAnalyzing && !!product &&
    (analysis?.matchedIngredients.length ?? 0) === 0;

  return {
    product,
    analysis,
    isLoadingProduct,
    isAnalyzing,
    error: error as Error | null,
    productNotFound: !isLoadingProduct && product === null,
    noIngredients,
  };
}

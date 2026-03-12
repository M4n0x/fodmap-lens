import { useQuery } from '@tanstack/react-query';
import { fetchProduct } from '@/src/services/openFoodFacts';
import type { OFFProduct } from '@/src/types/product';

export function useProductLookup(barcode: string) {
  return useQuery({
    queryKey: ['product', barcode],
    queryFn: async (): Promise<OFFProduct | null> => {
      const response = await fetchProduct(barcode);
      if (response.status !== 0 && response.product) {
        return response.product;
      }
      return null;
    },
    enabled: !!barcode,
    staleTime: Infinity,
    retry: 2,
  });
}

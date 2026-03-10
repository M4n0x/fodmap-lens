import type { OFFResponse } from '@/src/types/product';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'FODMAPScanner/1.0 (https://github.com/fodmap-scanner)';

export async function fetchProduct(barcode: string): Promise<OFFResponse> {
  const url = `${BASE_URL}/product/${encodeURIComponent(barcode)}.json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (response.status === 404) {
    return { status: 0, product: null } as OFFResponse;
  }

  if (!response.ok) {
    throw new Error(`OFF API error: ${response.status}`);
  }

  return response.json();
}

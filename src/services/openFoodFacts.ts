import type { OFFResponse } from '@/src/types/product';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'FODMAPScanner/1.0 (https://github.com/fodmap-scanner)';

const TIMEOUT_MS = 8000;

export async function fetchProduct(barcode: string): Promise<OFFResponse> {
  const url = `${BASE_URL}/product/${encodeURIComponent(barcode)}.json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404) {
    return { code: barcode, status: 0, status_verbose: 'product not found', product: undefined };
  }

  if (!response.ok) {
    throw new Error(`OFF API error: ${response.status}`);
  }

  return response.json();
}

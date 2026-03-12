export interface OFFIngredient {
  id: string;
  text: string;
  percent_estimate?: number;
  percent_max?: number;
  percent_min?: number;
  vegan?: string;
  vegetarian?: string;
}

export interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  product_name_fr?: string;
  product_name_de?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  ingredients?: OFFIngredient[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_text_fr?: string;
  ingredients_text_de?: string;
  quantity?: string;
  categories_tags?: string[];
  labels_tags?: string[];
  countries_tags?: string[];
  nutriments?: Record<string, number | string>;
  nutrient_levels?: Record<string, 'low' | 'moderate' | 'high'>;
  nutriscore_grade?: string;
}

export interface OFFResponse {
  code: string;
  product?: OFFProduct;
  status: number;
  status_verbose: string;
}

import type { FodmapRating } from './fodmap';

export interface ScanHistoryItem {
  id: number;
  barcode: string;
  product_name: string | null;
  brand: string | null;
  overall_score: number | null;
  overall_rating: FodmapRating | null;
  scanned_at: string;
  product_data: string | null;
  analysis_data: string | null;
  image_url?: string | null;
}


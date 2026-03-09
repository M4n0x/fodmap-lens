import type { SQLiteDatabase } from 'expo-sqlite';
import type { FodmapIngredient, FodmapCategory, FodmapRating, FodmapAnalysis, IngredientSynonym } from '@/src/types/fodmap';
import { FODMAP_CATEGORIES } from '@/src/types/fodmap';
import type { ScanHistoryItem } from '@/src/types/product';

export async function findIngredientByCanonicalKey(
  db: SQLiteDatabase,
  key: string
): Promise<FodmapIngredient | null> {
  return db.getFirstAsync<FodmapIngredient>(
    'SELECT * FROM fodmap_ingredients WHERE canonical_key = ?',
    [key]
  );
}

export async function findIngredientBySynonym(
  db: SQLiteDatabase,
  synonym: string,
  language?: string
): Promise<(FodmapIngredient & { matched_synonym: string }) | null> {
  const normalizedSynonym = synonym.toLowerCase().trim();

  if (language) {
    return db.getFirstAsync(
      `SELECT fi.*, s.synonym as matched_synonym
       FROM ingredient_synonyms s
       JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id
       WHERE s.synonym = ? AND s.language = ?`,
      [normalizedSynonym, language]
    );
  }

  return db.getFirstAsync(
    `SELECT fi.*, s.synonym as matched_synonym
     FROM ingredient_synonyms s
     JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id
     WHERE s.synonym = ?`,
    [normalizedSynonym]
  );
}

export async function findIngredientByPartialMatch(
  db: SQLiteDatabase,
  text: string
): Promise<(FodmapIngredient & { matched_synonym: string }) | null> {
  const normalizedText = text.toLowerCase().trim();

  return db.getFirstAsync(
    `SELECT fi.*, s.synonym as matched_synonym
     FROM ingredient_synonyms s
     JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id
     WHERE ? LIKE '%' || s.synonym || '%'
     ORDER BY LENGTH(s.synonym) DESC
     LIMIT 1`,
    [normalizedText]
  );
}

export async function getAllSynonyms(
  db: SQLiteDatabase
): Promise<(IngredientSynonym & { canonical_key: string })[]> {
  return db.getAllAsync(
    `SELECT s.*, fi.canonical_key
     FROM ingredient_synonyms s
     JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id`
  );
}

export async function getAllIngredients(
  db: SQLiteDatabase
): Promise<FodmapIngredient[]> {
  return db.getAllAsync('SELECT * FROM fodmap_ingredients ORDER BY canonical_key');
}

export async function searchIngredients(
  db: SQLiteDatabase,
  query: string,
  language?: string
): Promise<(FodmapIngredient & { matched_synonym: string })[]> {
  const normalizedQuery = query.toLowerCase().trim();
  const notesExpr = language === 'fr'
    ? 'COALESCE(fi.notes_fr, fi.notes)'
    : language === 'de'
      ? 'COALESCE(fi.notes_de, fi.notes)'
      : 'fi.notes';

  if (language) {
    return db.getAllAsync(
      `SELECT DISTINCT fi.*, ${notesExpr} as notes, s.synonym as matched_synonym
       FROM ingredient_synonyms s
       JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id
       WHERE s.synonym LIKE ? AND s.language = ?
       ORDER BY
         CASE WHEN s.synonym = ? THEN 0
              WHEN s.synonym LIKE ? THEN 1
              ELSE 2 END,
         fi.canonical_key
       LIMIT 50`,
      [`%${normalizedQuery}%`, language, normalizedQuery, `${normalizedQuery}%`]
    );
  }

  return db.getAllAsync(
    `SELECT DISTINCT fi.*, s.synonym as matched_synonym
     FROM ingredient_synonyms s
     JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id
     WHERE s.synonym LIKE ?
     ORDER BY
       CASE WHEN s.synonym = ? THEN 0
            WHEN s.synonym LIKE ? THEN 1
            ELSE 2 END,
       fi.canonical_key
     LIMIT 50`,
    [`%${normalizedQuery}%`, normalizedQuery, `${normalizedQuery}%`]
  );
}

export async function searchIngredientsByGroup(
  db: SQLiteDatabase,
  categories: FodmapCategory[],
  language?: string
): Promise<(FodmapIngredient & { matched_synonym: string })[]> {
  const conditions = categories
    .filter((col) => FODMAP_CATEGORIES.includes(col))
    .map((col) => `fi.${col} != 'green'`)
    .join(' OR ');

  const notesExpr = language === 'fr'
    ? 'COALESCE(fi.notes_fr, fi.notes)'
    : language === 'de'
      ? 'COALESCE(fi.notes_de, fi.notes)'
      : 'fi.notes';

  const langClause = language ? `AND s.language = ?` : '';
  const params = language ? [language] : [];

  return db.getAllAsync(
    `SELECT DISTINCT fi.*, ${notesExpr} as notes, s.synonym as matched_synonym
     FROM ingredient_synonyms s
     JOIN fodmap_ingredients fi ON fi.id = s.fodmap_ingredient_id
     WHERE (${conditions}) ${langClause} AND s.is_primary = 1
     ORDER BY fi.overall_rating DESC, fi.canonical_key
     LIMIT 100`,
    params
  );
}

// Scan History
export async function addScanHistoryItem(
  db: SQLiteDatabase,
  item: Omit<ScanHistoryItem, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO scan_history (barcode, product_name, brand, overall_score, overall_rating, scanned_at, product_data, analysis_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.barcode,
      item.product_name,
      item.brand,
      item.overall_score,
      item.overall_rating,
      item.scanned_at,
      item.product_data,
      item.analysis_data,
    ]
  );
  return result.lastInsertRowId;
}

export async function getScanHistory(
  db: SQLiteDatabase,
  limit = 50
): Promise<ScanHistoryItem[]> {
  return db.getAllAsync(
    'SELECT * FROM scan_history ORDER BY scanned_at DESC LIMIT ?',
    [limit]
  );
}

export async function updateScanHistoryOcr(
  db: SQLiteDatabase,
  barcode: string,
  overallScore: number,
  overallRating: FodmapRating,
  analysisData?: string
): Promise<void> {
  await db.runAsync(
    `UPDATE scan_history SET overall_score = ?, overall_rating = ?, analysis_data = COALESCE(?, analysis_data)
     WHERE id = (
       SELECT id FROM scan_history
       WHERE barcode = ?
       ORDER BY scanned_at DESC LIMIT 1
     )`,
    [overallScore, overallRating, analysisData ?? null, barcode]
  );
}

export async function getStoredAnalysis(
  db: SQLiteDatabase,
  barcode: string
): Promise<FodmapAnalysis | null> {
  const row = await db.getFirstAsync<{ analysis_data: string | null }>(
    `SELECT analysis_data FROM scan_history
     WHERE barcode = ? AND analysis_data IS NOT NULL
     ORDER BY scanned_at DESC LIMIT 1`,
    [barcode]
  );
  if (!row?.analysis_data) return null;
  try {
    return JSON.parse(row.analysis_data) as FodmapAnalysis;
  } catch {
    return null;
  }
}

export async function clearScanHistory(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM scan_history');
}

export async function deleteScanHistoryItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM scan_history WHERE id = ?', [id]);
}


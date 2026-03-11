import type { SQLiteDatabase } from 'expo-sqlite';

export const CREATE_FODMAP_INGREDIENTS = `
CREATE TABLE IF NOT EXISTS fodmap_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_key TEXT NOT NULL UNIQUE,
  category TEXT,
  fructans TEXT NOT NULL DEFAULT 'green',
  gos TEXT NOT NULL DEFAULT 'green',
  lactose TEXT NOT NULL DEFAULT 'green',
  excess_fructose TEXT NOT NULL DEFAULT 'green',
  sorbitol TEXT NOT NULL DEFAULT 'green',
  mannitol TEXT NOT NULL DEFAULT 'green',
  overall_rating TEXT NOT NULL DEFAULT 'green',
  notes TEXT,
  notes_fr TEXT,
  notes_de TEXT,
  source TEXT DEFAULT 'literature',
  confidence REAL DEFAULT 1.0,
  updated_at TEXT NOT NULL
);`;

export const CREATE_INGREDIENT_SYNONYMS = `
CREATE TABLE IF NOT EXISTS ingredient_synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fodmap_ingredient_id INTEGER NOT NULL REFERENCES fodmap_ingredients(id),
  synonym TEXT NOT NULL,
  language TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  UNIQUE(synonym, language)
);`;

export const CREATE_SCAN_HISTORY = `
CREATE TABLE IF NOT EXISTS scan_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  overall_score INTEGER,
  overall_rating TEXT,
  scanned_at TEXT NOT NULL,
  product_data TEXT,
  analysis_data TEXT
);`;

export const CREATE_SYNONYM_INDEX = `
CREATE INDEX IF NOT EXISTS idx_synonyms_lookup ON ingredient_synonyms(synonym, language);`;

export const CREATE_HISTORY_INDEX = `
CREATE INDEX IF NOT EXISTS idx_history_scanned_at ON scan_history(scanned_at DESC);`;

export async function createTables(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_FODMAP_INGREDIENTS);
  await db.execAsync(CREATE_INGREDIENT_SYNONYMS);
  await db.execAsync(CREATE_SCAN_HISTORY);
  await db.execAsync(CREATE_SYNONYM_INDEX);
  await db.execAsync(CREATE_HISTORY_INDEX);
}

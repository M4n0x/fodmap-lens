import type { SQLiteDatabase } from 'expo-sqlite';
import { createTables } from './schema';
import { seedFodmapData } from './fodmapData';

const CURRENT_VERSION = 7;

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<Record<string, number>>(
    'PRAGMA user_version;'
  );
  const version = row ? Object.values(row)[0] ?? 0 : 0;

  if (version < 1) {
    await createTables(db);

    const count = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM fodmap_ingredients;'
    );
    if (!count || count.cnt === 0) {
      await seedFodmapData(db);
    }
  }

  // v2: re-seed FODMAP data (adds water, sunflower oil, corn starch, calcium carbonate)
  // v3: adds wholemeal oat / oat / sea salt synonyms
  if (version < 3) {
    await db.execAsync('DELETE FROM ingredient_synonyms;');
    await db.execAsync('DELETE FROM fodmap_ingredients;');
    await seedFodmapData(db);
  }

  // v4: add analysis_data column for persisting OCR/manual analysis results
  if (version < 4) {
    await db.execAsync(
      `ALTER TABLE scan_history ADD COLUMN analysis_data TEXT;`
    ).catch(() => { /* column may already exist */ });
  }

  // v5: add notes_fr, notes_de columns and re-seed with translations
  if (version < 5) {
    await db.execAsync(`ALTER TABLE fodmap_ingredients ADD COLUMN notes_fr TEXT;`).catch(() => {});
    await db.execAsync(`ALTER TABLE fodmap_ingredients ADD COLUMN notes_de TEXT;`).catch(() => {});
    await db.execAsync('DELETE FROM ingredient_synonyms;');
    await db.execAsync('DELETE FROM fodmap_ingredients;');
    await seedFodmapData(db);
  }

  // v6: add serving size columns
  if (version < 6) {
    await db.execAsync(`ALTER TABLE fodmap_ingredients ADD COLUMN safe_serving_g REAL;`).catch(() => {});
    await db.execAsync(`ALTER TABLE fodmap_ingredients ADD COLUMN moderate_serving_g REAL;`).catch(() => {});
  }

  // v7: add source/confidence columns and re-seed with enriched KB data (277 ingredients)
  if (version < 7) {
    await db.execAsync(`ALTER TABLE fodmap_ingredients ADD COLUMN source TEXT DEFAULT 'literature';`).catch(() => {});
    await db.execAsync(`ALTER TABLE fodmap_ingredients ADD COLUMN confidence REAL DEFAULT 1.0;`).catch(() => {});
    await db.execAsync('DELETE FROM ingredient_synonyms;');
    await db.execAsync('DELETE FROM fodmap_ingredients;');
    await seedFodmapData(db);
  }

  if (version < CURRENT_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION};`);
  }
}

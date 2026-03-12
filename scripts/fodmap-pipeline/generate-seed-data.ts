/**
 * Generates src/db/fodmapData.ts from the knowledge-base.json file.
 *
 * Usage:
 *   npx tsx scripts/fodmap-pipeline/generate-seed-data.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const KB_PATH = join(__dirname, 'data', 'knowledge-base.json');
const OUTPUT_PATH = join(ROOT, 'src', 'db', 'fodmapData.ts');

interface KBRatings {
  fructans: string;
  gos: string;
  lactose: string;
  excess_fructose: string;
  sorbitol: string;
  mannitol: string;
}

interface KBIngredient {
  canonical_key: string;
  category: string;
  ratings: KBRatings;
  overall_rating: string;
  serving: { safe_g: number | null; moderate_g: number | null };
  confidence: { score: number };
  notes: { en: string; fr: string; de: string };
  synonyms: { en: string[]; fr: string[]; de: string[] };
  sources: string[];
}

interface KnowledgeBase {
  version: string;
  generated_at: string;
  pipeline_run: string;
  ingredients: Record<string, KBIngredient>;
}

function escapeTs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatStringArray(arr: string[], indent: string): string {
  if (arr.length === 0) return '[]';
  const items = arr.map((s) => `'${escapeTs(s)}'`).join(', ');
  // Keep on one line if short enough
  if (items.length + indent.length < 120) {
    return `[${items}]`;
  }
  return `[\n${indent}  ${arr.map((s) => `'${escapeTs(s)}'`).join(`,\n${indent}  `)},\n${indent}]`;
}

function formatIngredient(ing: KBIngredient): string {
  const r = ing.ratings;
  const lines: string[] = [];
  lines.push(`  {`);
  lines.push(`    canonical_key: '${escapeTs(ing.canonical_key)}',`);
  lines.push(`    category: '${escapeTs(ing.category)}',`);
  lines.push(
    `    fructans: '${r.fructans}', gos: '${r.gos}', lactose: '${r.lactose}', excess_fructose: '${r.excess_fructose}', sorbitol: '${r.sorbitol}', mannitol: '${r.mannitol}',`
  );
  lines.push(`    overall_rating: '${ing.overall_rating}',`);
  lines.push(
    `    safe_serving_g: ${ing.serving.safe_g}, moderate_serving_g: ${ing.serving.moderate_g},`
  );
  lines.push(`    source: '${escapeTs(ing.sources.join(','))}',`);
  lines.push(`    confidence: ${ing.confidence.score},`);
  lines.push(`    notes: '${escapeTs(ing.notes.en)}',`);
  lines.push(`    notes_fr: ${ing.notes.fr ? `'${escapeTs(ing.notes.fr)}'` : 'null'},`);
  lines.push(`    notes_de: ${ing.notes.de ? `'${escapeTs(ing.notes.de)}'` : 'null'},`);
  lines.push(`    synonyms: {`);
  lines.push(`      en: ${formatStringArray(ing.synonyms.en, '      ')},`);
  lines.push(`      fr: ${formatStringArray(ing.synonyms.fr, '      ')},`);
  lines.push(`      de: ${formatStringArray(ing.synonyms.de, '      ')},`);
  lines.push(`    },`);
  lines.push(`  },`);
  return lines.join('\n');
}

function main() {
  const kb: KnowledgeBase = JSON.parse(readFileSync(KB_PATH, 'utf-8'));
  // Use the dict key as canonical_key if the field is missing
  const ingredients = Object.entries(kb.ingredients).map(([key, ing]) => ({
    ...ing,
    canonical_key: ing.canonical_key ?? key,
  }));

  // Sort by category, then by canonical_key within each category
  ingredients.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.canonical_key.localeCompare(b.canonical_key);
  });

  // Group by category for section comments
  const byCategory = new Map<string, KBIngredient[]>();
  for (const ing of ingredients) {
    const list = byCategory.get(ing.category) ?? [];
    list.push(ing);
    byCategory.set(ing.category, list);
  }

  const seedEntries: string[] = [];
  for (const [category, items] of byCategory) {
    seedEntries.push(`  // === ${category.toUpperCase()} ===`);
    for (const item of items) {
      seedEntries.push(formatIngredient(item));
    }
  }

  const output = `// Auto-generated from knowledge-base.json — do not edit manually.
// Run: npx tsx scripts/fodmap-pipeline/generate-seed-data.ts
// Source: ${kb.version} (${kb.generated_at})

import type { SQLiteDatabase } from 'expo-sqlite';
import type { FodmapRating } from '@/src/types/fodmap';

interface SeedIngredient {
  canonical_key: string;
  category: string;
  fructans: FodmapRating;
  gos: FodmapRating;
  lactose: FodmapRating;
  excess_fructose: FodmapRating;
  sorbitol: FodmapRating;
  mannitol: FodmapRating;
  overall_rating: FodmapRating;
  safe_serving_g: number | null;
  moderate_serving_g: number | null;
  source: string;
  confidence: number;
  notes: string | null;
  notes_fr: string | null;
  notes_de: string | null;
  synonyms: { en: string[]; fr: string[]; de: string[] };
}

const SEED_DATA: SeedIngredient[] = [
${seedEntries.join('\n')}
];

export async function seedFodmapData(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  for (const item of SEED_DATA) {
    const result = await db.runAsync(
      \`INSERT OR IGNORE INTO fodmap_ingredients (canonical_key, category, fructans, gos, lactose, excess_fructose, sorbitol, mannitol, overall_rating, safe_serving_g, moderate_serving_g, notes, notes_fr, notes_de, source, confidence, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        item.canonical_key,
        item.category,
        item.fructans,
        item.gos,
        item.lactose,
        item.excess_fructose,
        item.sorbitol,
        item.mannitol,
        item.overall_rating,
        item.safe_serving_g,
        item.moderate_serving_g,
        item.notes,
        item.notes_fr,
        item.notes_de,
        item.source,
        item.confidence,
        now,
      ]
    );

    let ingredientId = result.lastInsertRowId;
    if (result.changes === 0) {
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM fodmap_ingredients WHERE canonical_key = ?',
        [item.canonical_key]
      );
      if (!existing) continue;
      ingredientId = existing.id;
    }

    for (const [lang, synonyms] of Object.entries(item.synonyms)) {
      for (let i = 0; i < synonyms.length; i++) {
        await db.runAsync(
          \`INSERT OR IGNORE INTO ingredient_synonyms (fodmap_ingredient_id, synonym, language, is_primary) VALUES (?, ?, ?, ?)\`,
          [ingredientId, synonyms[i].toLowerCase(), lang, i === 0 ? 1 : 0]
        );
      }
    }
  }
}
`;

  writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(
    `Generated ${OUTPUT_PATH} with ${ingredients.length} ingredients from knowledge-base ${kb.version}`
  );
}

main();

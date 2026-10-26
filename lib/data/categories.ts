import { cacheLife, cacheTag } from "next/cache";
import { appendRow, deleteRows, findRowNumber, readRange, writeRanges } from "@/lib/sheets/client";
import { categoryToRow, escapeText, rowsToCategories } from "@/lib/sheets/mappers";
import { CATEGORIES_SHEET } from "@/lib/sheets/schema";
import type { Category } from "@/lib/types";
import { NotFoundError } from "@/lib/errors";
import { SHEET_CACHE } from "./cache";
import { tags } from "./tags";

/** Older versions soft-deleted categories by renaming them with this prefix. */
const LEGACY_DELETED_PREFIX = "DELETED_";

export async function listCategories(): Promise<Category[]> {
  "use cache";
  cacheLife(SHEET_CACHE);
  cacheTag(tags.categories);
  const categories = rowsToCategories(await readRange(`${CATEGORIES_SHEET}!A2:D`));
  return categories.filter((c) => !c.name.startsWith(LEGACY_DELETED_PREFIX));
}

// ─── Writes (callers hold withWriteLock) ─────────────────────────────────────

export async function insertCategory(category: Category) {
  await appendRow(CATEGORIES_SHEET, categoryToRow(category));
}

/** The type is fixed at creation; only the name and color can change. */
export async function updateCategory(id: string, data: Pick<Category, "name" | "color">) {
  const row = await findRowNumber(CATEGORIES_SHEET, id);
  if (!row) throw new NotFoundError("Kategori tidak ditemukan");
  await writeRanges([
    { range: `${CATEGORIES_SHEET}!B${row}`, values: [[escapeText(data.name)]] },
    { range: `${CATEGORIES_SHEET}!D${row}`, values: [[data.color]] },
  ]);
}

/** Transactions keep the category name as text, so deleting a category leaves history intact. */
export async function removeCategory(id: string) {
  const row = await findRowNumber(CATEGORIES_SHEET, id);
  if (!row) throw new NotFoundError("Kategori tidak ditemukan");
  await deleteRows(CATEGORIES_SHEET, [row]);
}

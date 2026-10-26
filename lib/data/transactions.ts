import { cacheLife, cacheTag } from "next/cache";
import {
  appendRow,
  deleteRows,
  findRowNumber,
  listSheets,
  readRange,
  readRanges,
  writeRanges,
} from "@/lib/sheets/client";
import { rowsToTransactions, transactionToRow } from "@/lib/sheets/mappers";
import {
  isTransactionSheet,
  monthKeyFromDate,
  monthKeyFromSheetName,
  monthsBetween,
  sheetNameForMonth,
  type MonthKey,
} from "@/lib/sheets/schema";
import { ensureMonthSheet } from "@/lib/sheets/setup";
import { NotFoundError } from "@/lib/errors";
import type { Transaction } from "@/lib/types";
import { SHEET_CACHE } from "./cache";
import { tags } from "./tags";

export async function listTransactions(month: MonthKey): Promise<Transaction[]> {
  "use cache";
  cacheLife(SHEET_CACHE);
  cacheTag(tags.transactions, tags.month(month));
  return rowsToTransactions(await readRange(`${sheetNameForMonth(month)}!A2:H`));
}

/** Transactions dated within [from, to] ("yyyy-MM-dd", inclusive), newest first. */
export async function listTransactionsBetween(from: string, to: string): Promise<Transaction[]> {
  const months = monthsBetween(monthKeyFromDate(from), monthKeyFromDate(to));
  const perMonth = await Promise.all(months.map(listTransactions));
  return perMonth
    .reverse()
    .flat()
    .filter((t) => t.date >= from && t.date <= to);
}

/** Months that have a transaction sheet, oldest first. */
export async function listTransactionMonths(): Promise<MonthKey[]> {
  "use cache";
  cacheLife(SHEET_CACHE);
  cacheTag(tags.transactions);
  return (await listSheets())
    .map((s) => monthKeyFromSheetName(s.title))
    .filter((m): m is MonthKey => m !== null)
    .sort();
}

/** Every transaction from the last `maxMonths` months that have a sheet. */
export async function listRecentTransactions(maxMonths: number): Promise<Transaction[]> {
  const months = (await listTransactionMonths()).slice(-maxMonths);
  return (await Promise.all(months.map(listTransactions))).flat();
}

export type EditPlan =
  | { kind: "in-place"; sheet: string }
  | { kind: "move"; from: string; to: string; toMonth: MonthKey };

/** Transactions live in one sheet per month, so changing the month means moving the row. */
export function planTransactionEdit(originalDate: string, newDate: string): EditPlan {
  const fromMonth = monthKeyFromDate(originalDate);
  const toMonth = monthKeyFromDate(newDate);
  if (fromMonth === toMonth) return { kind: "in-place", sheet: sheetNameForMonth(fromMonth) };
  return {
    kind: "move",
    from: sheetNameForMonth(fromMonth),
    to: sheetNameForMonth(toMonth),
    toMonth,
  };
}

// ─── Writes (callers hold withWriteLock) ─────────────────────────────────────

export async function insertTransaction(tx: Transaction) {
  await ensureMonthSheet(monthKeyFromDate(tx.date));
  await appendRow(sheetNameForMonth(monthKeyFromDate(tx.date)), transactionToRow(tx));
}

export async function replaceTransaction(originalDate: string, tx: Transaction) {
  const plan = planTransactionEdit(originalDate, tx.date);
  const sourceSheet = plan.kind === "in-place" ? plan.sheet : plan.from;
  const row = await findRowNumber(sourceSheet, tx.id);
  if (!row) throw new NotFoundError("Transaksi tidak ditemukan");

  if (plan.kind === "in-place") {
    await writeRanges([{ range: `${plan.sheet}!A${row}:H${row}`, values: [transactionToRow(tx)] }]);
    return;
  }

  // Append before deleting: if the delete fails we end up with a duplicate the
  // user can remove, never with a lost transaction.
  await ensureMonthSheet(plan.toMonth);
  await appendRow(plan.to, transactionToRow(tx));
  const oldRow = await findRowNumber(plan.from, tx.id);
  if (oldRow) await deleteRows(plan.from, [oldRow]);
}

export async function removeTransaction(id: string, date: string) {
  const sheet = sheetNameForMonth(monthKeyFromDate(date));
  const row = await findRowNumber(sheet, id);
  if (!row) throw new NotFoundError("Transaksi tidak ditemukan");
  await deleteRows(sheet, [row]);
}

/** Every transaction touching the wallet, as source or as transfer target. */
async function findWalletTransactionRows(walletId: string) {
  const titles = (await listSheets()).map((s) => s.title).filter(isTransactionSheet);
  const data = await readRanges(titles.map((title) => `${title}!A:H`));
  return titles.map((title, s) => ({
    title,
    rows: data[s].flatMap((row, i) =>
      i > 0 && (String(row[6] ?? "") === walletId || String(row[7] ?? "") === walletId) ? [i + 1] : []
    ),
  }));
}

export async function countWalletTransactions(walletId: string): Promise<number> {
  const found = await findWalletTransactionRows(walletId);
  return found.reduce((sum, s) => sum + s.rows.length, 0);
}

export async function removeWalletTransactions(walletId: string) {
  for (const { title, rows } of await findWalletTransactionRows(walletId)) {
    await deleteRows(title, rows);
  }
}

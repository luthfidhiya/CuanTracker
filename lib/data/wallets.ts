import { cacheLife, cacheTag } from "next/cache";
import { appendRow, deleteRows, findRowNumber, readRange, writeRanges } from "@/lib/sheets/client";
import { escapeText, rowsToWallets, walletToRow } from "@/lib/sheets/mappers";
import { WALLETS_SHEET } from "@/lib/sheets/schema";
import { syncWalletFormulas } from "@/lib/sheets/setup";
import type { Wallet, WalletWithBalance } from "@/lib/types";
import { NotFoundError } from "@/lib/errors";
import { SHEET_CACHE } from "./cache";
import { tags } from "./tags";
import { removeWalletTransactions } from "./transactions";

export async function listWallets(): Promise<WalletWithBalance[]> {
  "use cache";
  cacheLife(SHEET_CACHE);
  cacheTag(tags.wallets);
  return rowsToWallets(await readRange(`${WALLETS_SHEET}!A2:H`));
}

// ─── Writes (callers hold withWriteLock) ─────────────────────────────────────

export async function insertWallet(wallet: Wallet) {
  await appendRow(WALLETS_SHEET, walletToRow(wallet));
  await syncWalletFormulas();
}

export async function updateWallet(
  id: string,
  data: Pick<Wallet, "name" | "type" | "color">
) {
  const row = await findRowNumber(WALLETS_SHEET, id);
  if (!row) throw new NotFoundError("Dompet tidak ditemukan");
  await writeRanges([
    { range: `${WALLETS_SHEET}!B${row}:C${row}`, values: [[escapeText(data.name), data.type]] },
    { range: `${WALLETS_SHEET}!E${row}`, values: [[data.color]] },
  ]);
}

/** Deletes the wallet and every transaction that touches it, including transfers. */
export async function removeWallet(id: string) {
  if (!(await findRowNumber(WALLETS_SHEET, id))) throw new NotFoundError("Dompet tidak ditemukan");
  await removeWalletTransactions(id);
  const row = await findRowNumber(WALLETS_SHEET, id);
  if (row) await deleteRows(WALLETS_SHEET, [row]);
  await syncWalletFormulas();
}

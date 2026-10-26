import {
  deleteSheet,
  ensureSheet,
  getSheets,
  getSpreadsheetId,
  listSheets,
  readRange,
} from "./client";
import { walletBalanceFormula } from "./formulas";
import {
  CATEGORIES_SHEET,
  CATEGORY_HEADERS,
  TRANSACTION_HEADERS,
  WALLETS_SHEET,
  WALLET_HEADERS,
  currentMonthKey,
  isTransactionSheet,
  sheetNameForMonth,
  type MonthKey,
} from "./schema";

/** Rewrites every wallet's balance formula to cover all transaction sheets. */
export async function syncWalletFormulas() {
  const transactionSheets = (await listSheets())
    .map((s) => s.title)
    .filter(isTransactionSheet);

  const wallets = await readRange(`${WALLETS_SHEET}!A2:H`);
  if (wallets.length === 0) return;

  const values = wallets.map((_, i) => [walletBalanceFormula(i + 2, transactionSheets)]);
  await getSheets().spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `${WALLETS_SHEET}!H1`, values: [["CurrentBalance"]] },
        { range: `${WALLETS_SHEET}!H2:H${values.length + 1}`, values },
      ],
    },
  });
}

/** Makes sure the month's transaction sheet exists, and that balances include it. */
export async function ensureMonthSheet(month: MonthKey) {
  const created = await ensureSheet(sheetNameForMonth(month), TRANSACTION_HEADERS);
  if (created) await syncWalletFormulas();
}

let setupPromise: Promise<void> | null = null;

/**
 * Creates the base sheets on first write to a fresh spreadsheet. Runs once per
 * server process; reads never need it because missing sheets read as empty.
 */
export function ensureSpreadsheetReady(): Promise<void> {
  setupPromise ??= (async () => {
    const created = [
      await ensureSheet(WALLETS_SHEET, WALLET_HEADERS),
      await ensureSheet(CATEGORIES_SHEET, CATEGORY_HEADERS),
      await ensureSheet(sheetNameForMonth(currentMonthKey()), TRANSACTION_HEADERS),
    ];
    if (created.some(Boolean)) await syncWalletFormulas();

    // A brand-new spreadsheet starts with an empty "Sheet1"; drop it once ours exist.
    const sheets = await listSheets();
    const sheet1 = sheets.find((s) => s.title === "Sheet1");
    if (sheet1 && sheets.length > 1) {
      await deleteSheet(sheet1.sheetId).catch((e) =>
        console.warn("[sheets] could not delete Sheet1:", e instanceof Error ? e.message : e)
      );
    }
  })().catch((error) => {
    setupPromise = null; // retry on the next write
    throw error;
  });
  return setupPromise;
}

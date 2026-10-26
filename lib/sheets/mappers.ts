import type {
  Category,
  CategoryType,
  Transaction,
  TransactionType,
  Wallet,
  WalletWithBalance,
} from "@/lib/types";

export type Cell = string | number | boolean | null | undefined;
export type Row = Cell[];

function str(value: Cell): string {
  return value === null || value === undefined ? "" : String(value);
}

function num(value: Cell): number {
  const parsed = parseFloat(str(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Dates written with USER_ENTERED come back as spreadsheet serial numbers
 * (days since 1899-12-30); older rows may hold plain "yyyy-MM-dd" text.
 */
export function parseSheetDate(value: Cell): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  return String(value).trim();
}

/**
 * Text that starts with = + - @ would be evaluated as a formula under
 * USER_ENTERED. A leading apostrophe makes Sheets store it as plain text
 * (the apostrophe itself is not stored).
 */
export function escapeText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

const hasId = (row: Row) => str(row[0]) !== "";

export function rowToWallet(row: Row): WalletWithBalance {
  const initialBalance = num(row[3]);
  const rawBalance = str(row[7]);
  const parsedBalance = parseFloat(rawBalance);
  return {
    id: str(row[0]),
    name: str(row[1]),
    type: str(row[2]),
    initialBalance,
    color: str(row[4]),
    currencyCode: str(row[5]) || "IDR",
    currencySymbol: str(row[6]) || "Rp",
    // A valid zero balance must be kept; only fall back when the formula cell is empty or broken.
    currentBalance:
      rawBalance !== "" && Number.isFinite(parsedBalance)
        ? parsedBalance
        : initialBalance,
  };
}

export function rowsToWallets(rows: Row[]): WalletWithBalance[] {
  return rows.filter(hasId).map(rowToWallet);
}

export function walletToRow(wallet: Wallet): (string | number)[] {
  return [
    wallet.id,
    escapeText(wallet.name),
    wallet.type,
    wallet.initialBalance,
    wallet.color,
    wallet.currencyCode,
    wallet.currencySymbol,
  ];
}

export function rowToCategory(row: Row): Category {
  return {
    id: str(row[0]),
    name: str(row[1]),
    type: str(row[2]) as CategoryType,
    color: str(row[3]),
  };
}

export function rowsToCategories(rows: Row[]): Category[] {
  return rows.filter(hasId).map(rowToCategory);
}

export function categoryToRow(category: Category): string[] {
  return [category.id, escapeText(category.name), category.type, category.color];
}

export function rowToTransaction(row: Row): Transaction {
  const toWalletId = str(row[7]);
  return {
    id: str(row[0]),
    date: parseSheetDate(row[1]),
    amount: num(row[2]),
    type: str(row[3]) as TransactionType,
    category: str(row[4]),
    description: str(row[5]),
    walletId: str(row[6]),
    toWalletId: toWalletId || undefined,
  };
}

/** Newest first; rows on the same date keep reverse insertion order. */
export function rowsToTransactions(rows: Row[]): Transaction[] {
  return rows
    .filter(hasId)
    .map((row, index) => ({ tx: rowToTransaction(row), index }))
    .sort((a, b) =>
      a.tx.date === b.tx.date ? b.index - a.index : a.tx.date < b.tx.date ? 1 : -1
    )
    .map(({ tx }) => tx);
}

export function transactionToRow(tx: Transaction): (string | number)[] {
  return [
    tx.id,
    tx.date,
    tx.amount,
    tx.type,
    escapeText(tx.category),
    escapeText(tx.description),
    tx.walletId,
    tx.toWalletId || "",
  ];
}

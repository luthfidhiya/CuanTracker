// Spreadsheet layout. Existing user data depends on these names and column
// orders, so they must stay compatible with sheets created by older versions.

export const WALLETS_SHEET = "Wallets";
export const CATEGORIES_SHEET = "Categories";
export const TRANSACTION_SHEET_PREFIX = "Transactions_";

export const WALLET_HEADERS = [
  "ID",
  "Name",
  "Type",
  "InitialBalance",
  "Color",
  "CurrencyCode",
  "CurrencySymbol",
  "CurrentBalance",
];
export const CATEGORY_HEADERS = ["ID", "Name", "Type", "Color"];
export const TRANSACTION_HEADERS = [
  "ID",
  "Date",
  "Amount",
  "Type",
  "Category",
  "Description",
  "WalletId",
  "ToWalletId",
];

/** Dates are interpreted in this zone so "today" and "this month" match the user, not the server. */
export const APP_TIME_ZONE = "Asia/Jakarta";

/** "yyyy-MM", e.g. "2026-10". */
export type MonthKey = string;

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_KEY_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_RE = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && MONTH_KEY_RE.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** "2026-10-05" -> "2026-10". Pure string math, so it never shifts with the server time zone. */
export function monthKeyFromDate(isoDate: string): MonthKey {
  if (!isIsoDate(isoDate)) throw new Error(`Invalid date: ${isoDate}`);
  return isoDate.slice(0, 7);
}

/** "2026-10" -> "Transactions_Oct2026" (same naming as date-fns "MMMyyy"). */
export function sheetNameForMonth(key: MonthKey): string {
  const match = MONTH_KEY_RE.exec(key);
  if (!match) throw new Error(`Invalid month: ${key}`);
  return `${TRANSACTION_SHEET_PREFIX}${MONTH_ABBR[Number(match[2]) - 1]}${match[1]}`;
}

/** "Transactions_Oct2026" -> "2026-10", or null for any other sheet. */
export function monthKeyFromSheetName(name: string): MonthKey | null {
  const match = /^Transactions_([A-Z][a-z]{2})(\d{4})$/.exec(name);
  if (!match) return null;
  const index = MONTH_ABBR.indexOf(match[1]);
  if (index === -1) return null;
  return `${match[2]}-${String(index + 1).padStart(2, "0")}`;
}

export function isTransactionSheet(name: string | null | undefined): name is string {
  return !!name && name.startsWith(TRANSACTION_SHEET_PREFIX);
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Inclusive list of months from `from` to `to`. Empty when `from` is after `to`. */
export function monthsBetween(from: MonthKey, to: MonthKey): MonthKey[] {
  const months: MonthKey[] = [];
  for (let key = from; key <= to; key = shiftMonth(key, 1)) months.push(key);
  return months;
}

/**
 * Moves a date by whole months, keeping the day where possible: 31 Oct - 1 month
 * is 30 Sep. A month's last day maps to the target month's last day.
 */
export function shiftDate(iso: string, months: number): string {
  const month = shiftMonth(monthKeyFromDate(iso), months);
  const lastDay = lastDayOfMonth(month);
  if (iso === lastDayOfMonth(monthKeyFromDate(iso))) return lastDay;
  const day = iso.slice(8, 10);
  return `${month}-${day}` > lastDay ? lastDay : `${month}-${day}`;
}

/** Inclusive list of "yyyy-MM-dd" days from `from` to `to`. Empty when `from` is after `to`. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const [y, m, d] = from.split("-").map(Number);
  for (let date = new Date(Date.UTC(y, m - 1, d)); ; date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = date.toISOString().slice(0, 10);
    if (iso > to) return days;
    days.push(iso);
  }
}

/** Today's date as "yyyy-MM-dd" in APP_TIME_ZONE. */
export function todayIso(now: Date = new Date()): string {
  // en-CA formats as yyyy-MM-dd.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return todayIso(now).slice(0, 7);
}

export function firstDayOfMonth(key: MonthKey): string {
  return `${key}-01`;
}

export function lastDayOfMonth(key: MonthKey): string {
  const [y, m] = key.split("-").map(Number);
  const day = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${key}-${String(day).padStart(2, "0")}`;
}

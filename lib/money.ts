import { getCurrency } from "./currencies";

const LOCALE = "id-ID";

function fractionDigits(code: string) {
  const cur = getCurrency(code);
  if (cur.code === "IDR") return { minimumFractionDigits: 0, maximumFractionDigits: 2 };
  if (cur.type === "fiat") return { minimumFractionDigits: cur.decimals, maximumFractionDigits: cur.decimals };
  return { minimumFractionDigits: 2, maximumFractionDigits: cur.decimals };
}

/** "1.234.567" / "12,50" — number only, formatted for the currency's precision. */
export function formatNumber(amount: number, currencyCode = "IDR"): string {
  return amount.toLocaleString(LOCALE, fractionDigits(currencyCode));
}

/** "Rp 1.234.567", "$ 12,50", "₿ 0,00012300". */
export function formatMoney(amount: number, currencyCode = "IDR"): string {
  return `${getCurrency(currencyCode).symbol} ${formatNumber(amount, currencyCode)}`;
}

/** Short IDR label for chart axes: "Rp 450 rb", "Rp 1,2 jt", "Rp 3,4 M". */
export function formatIdrCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const fmt = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });
  if (abs >= 1e9) return `${sign}Rp ${fmt(abs / 1e9)} M`;
  if (abs >= 1e6) return `${sign}Rp ${fmt(abs / 1e6)} jt`;
  if (abs >= 1e3) return `${sign}Rp ${fmt(abs / 1e3)} rb`;
  return `${sign}Rp ${fmt(abs)}`;
}

/**
 * Parses what the user typed in an amount field ("1.250.000,5") into a number.
 * Dots are thousands separators and the comma is the decimal mark (id-ID).
 */
export function parseAmountInput(text: string): number {
  const normalized = text.replace(/[^\d,]/g, "").replace(",", ".").replace(/,/g, "");
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** Reformats a partially typed amount, keeping a trailing comma and decimals as typed. */
export function formatAmountInput(text: string): string {
  const cleaned = text.replace(/[^\d,]/g, "");
  if (!cleaned) return "";
  const [intPart, ...rest] = cleaned.split(",");
  const intFormatted = intPart ? Number(intPart).toLocaleString(LOCALE) : "0";
  return rest.length > 0 ? `${intFormatted},${rest.join("")}` : intFormatted;
}

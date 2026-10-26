import { todayIso, type MonthKey } from "./sheets/schema";

const LOCALE = "id-ID";

// Dates are plain "yyyy-MM-dd" strings; formatting them as UTC midnight keeps
// the calendar day from shifting with the viewer's time zone.
function utcDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d ?? 1));
}

function fmt(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options }).format(utcDate(iso));
}

/** "2026-10" -> "Oktober 2026" */
export function formatMonth(month: MonthKey) {
  return fmt(`${month}-01`, { month: "long", year: "numeric" });
}

/** "2026-10" -> "Okt 2026" */
export function formatMonthShort(month: MonthKey) {
  return fmt(`${month}-01`, { month: "short", year: "numeric" });
}

/** "2026-10-26" -> "26 Okt" */
export function formatShortDate(iso: string) {
  return fmt(iso, { day: "numeric", month: "short" });
}

/** "2026-10-26" -> "26 Okt 2026" */
export function formatDate(iso: string) {
  return fmt(iso, { day: "numeric", month: "short", year: "numeric" });
}

/** Group header in transaction lists: "Hari ini", "Kemarin", or "Senin, 26 Okt". */
export function formatDayHeading(iso: string, today: string = todayIso()) {
  if (iso === today) return "Hari ini";
  if (iso === shiftDay(today, -1)) return "Kemarin";
  return fmt(iso, { weekday: "long", day: "numeric", month: "short" });
}

function shiftDay(iso: string, delta: number) {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

import { currentMonthKey, isIsoDate, isMonthKey, type MonthKey } from "./sheets/schema";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** `?month=yyyy-MM`, defaulting to the current month. */
export function monthParam(value: string | string[] | undefined): MonthKey {
  const month = firstParam(value);
  return isMonthKey(month) ? month : currentMonthKey();
}

export function dateParam(value: string | string[] | undefined): string | undefined {
  const date = firstParam(value);
  return isIsoDate(date) ? date : undefined;
}

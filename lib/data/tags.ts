import type { MonthKey } from "@/lib/sheets/schema";

/** Cache tags for `cacheTag` (reads) and `updateTag` (after writes). */
export const tags = {
  wallets: "wallets",
  categories: "categories",
  /** Every transaction month. */
  transactions: "tx",
  month: (month: MonthKey) => `tx:${month}`,
  rates: "rates",
};

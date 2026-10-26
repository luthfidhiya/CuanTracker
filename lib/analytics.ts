import { convertToUsd, type ExchangeRates } from "./exchange";
import { daysBetween, monthKeyFromDate, monthsBetween, shiftDate } from "./sheets/schema";
import type {
  Category,
  DetailedStats,
  MonthTotals,
  StatItem,
  Transaction,
  Trend,
  Wallet,
  WalletWithBalance,
} from "./types";

/** Used when a category has no color stored. */
const FALLBACK_COLORS = ["#64748b", "#94a3b8", "#475569", "#cbd5e1"];

export function toIdr(amount: number, currencyCode: string, rates: ExchangeRates): number {
  return convertToUsd(amount, currencyCode, rates) * rates.usdToIdr;
}

function walletCurrency(wallets: Map<string, Wallet>, walletId: string) {
  return wallets.get(walletId)?.currencyCode || "IDR";
}

/** Income and expense in IDR. Transfers move money between own wallets, so they are excluded. */
export function sumIncomeExpense(
  transactions: Transaction[],
  wallets: Wallet[],
  rates: ExchangeRates
): MonthTotals {
  const byId = new Map(wallets.map((w) => [w.id, w]));
  const totals: MonthTotals = { income: 0, expense: 0 };
  for (const t of transactions) {
    if (t.type !== "INCOME" && t.type !== "EXPENSE") continue;
    const idr = toIdr(t.amount, walletCurrency(byId, t.walletId), rates);
    if (t.type === "INCOME") totals.income += idr;
    else totals.expense += idr;
  }
  return totals;
}

export function totalBalance(wallets: WalletWithBalance[], rates: ExchangeRates) {
  const usd = wallets.reduce(
    (sum, w) => sum + convertToUsd(w.currentBalance, w.currencyCode, rates),
    0
  );
  return { usd, idr: usd * rates.usdToIdr };
}

function toStatItems(totals: Map<string, number>, resolve: (key: string) => Omit<StatItem, "value">) {
  return [...totals.entries()]
    .map(([key, value]) => ({ ...resolve(key), value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * A single-month range is charted per day, anything longer per month. Every
 * bucket in the range is present so empty days/months show as zero instead of
 * the line jumping straight over them.
 */
function emptyTrend(from: string, to: string) {
  const months = monthsBetween(monthKeyFromDate(from), monthKeyFromDate(to));
  const granularity: Trend["granularity"] = months.length <= 1 ? "day" : "month";
  const keys = granularity === "day" ? daysBetween(from, to) : months;
  return { granularity, buckets: new Map<string, MonthTotals>(keys.map((k) => [k, { income: 0, expense: 0 }])) };
}

export function buildDetailedStats(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  rates: ExchangeRates,
  range: { from: string; to: string }
): DetailedStats {
  const walletById = new Map(wallets.map((w) => [w.id, w]));
  const categoryColor = (type: Category["type"]) =>
    new Map(categories.filter((c) => c.type === type).map((c) => [c.name, c.color]));
  const expenseColor = categoryColor("EXPENSE");
  const incomeColor = categoryColor("INCOME");

  const { granularity, buckets } = emptyTrend(range.from, range.to);
  const expenseByCategory = new Map<string, number>();
  const incomeByCategory = new Map<string, number>();
  const expenseByWallet = new Map<string, number>();
  const incomeByWallet = new Map<string, number>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type !== "INCOME" && t.type !== "EXPENSE") continue;
    const amount = toIdr(t.amount, walletCurrency(walletById, t.walletId), rates);
    const key = granularity === "day" ? t.date : monthKeyFromDate(t.date);
    const bucket = buckets.get(key);
    const category = t.category || "Tanpa kategori";

    if (t.type === "INCOME") {
      if (bucket) bucket.income += amount;
      totalIncome += amount;
      incomeByWallet.set(t.walletId, (incomeByWallet.get(t.walletId) ?? 0) + amount);
      incomeByCategory.set(category, (incomeByCategory.get(category) ?? 0) + amount);
    } else {
      if (bucket) bucket.expense += amount;
      totalExpense += amount;
      expenseByWallet.set(t.walletId, (expenseByWallet.get(t.walletId) ?? 0) + amount);
      expenseByCategory.set(category, (expenseByCategory.get(category) ?? 0) + amount);
    }
  }

  let fallback = 0;
  const categoryItem = (colors: Map<string, string>) => (name: string) => ({
    name,
    color: colors.get(name) || FALLBACK_COLORS[fallback++ % FALLBACK_COLORS.length],
  });
  const walletItem = (id: string) => ({
    name: walletById.get(id)?.name ?? "Dompet terhapus",
    color: walletById.get(id)?.color || FALLBACK_COLORS[0],
  });

  return {
    // Keys were inserted in date order, so the map is already chronological.
    trend: { granularity, points: [...buckets.entries()].map(([key, totals]) => ({ key, ...totals })) },
    totalIncome,
    totalExpense,
    expenseByCategory: toStatItems(expenseByCategory, categoryItem(expenseColor)),
    incomeByCategory: toStatItems(incomeByCategory, categoryItem(incomeColor)),
    expenseByWallet: toStatItems(expenseByWallet, walletItem),
    incomeByWallet: toStatItems(incomeByWallet, walletItem),
  };
}

/**
 * The period a range is compared against. Up to 6 months it's the period just
 * before (Oct 1–26 → Sep 1–26, Aug–Oct → May–Jul); longer ranges compare with
 * the same dates a year earlier, which is what "this year" is usually held against.
 */
export function previousPeriod(from: string, to: string) {
  const months = monthsBetween(monthKeyFromDate(from), monthKeyFromDate(to)).length;
  const shift = months <= 6 ? months : Math.max(12, months);
  return { from: shiftDate(from, -shift), to: shiftDate(to, -shift) };
}

/** Relative change in percent, or null when there's nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** How a transaction moves a wallet's balance: +income, -expense, -/+ transfer out/in. */
function walletFlows(t: Transaction): [walletId: string, delta: number][] {
  switch (t.type) {
    case "INCOME":
      return [[t.walletId, t.amount]];
    case "EXPENSE":
      return [[t.walletId, -t.amount]];
    case "TRANSFER":
      return t.toWalletId ? [[t.walletId, -t.amount], [t.toWalletId, t.amount]] : [[t.walletId, -t.amount]];
  }
}

/**
 * Total balance in IDR at the end of each month, worked backwards from today's
 * balances by undoing later transactions. Rates are today's, since past rates
 * aren't stored. Wallets have no creation date, so a wallet counts from the
 * month of its first transaction; before that its opening balance would
 * otherwise show up in months it didn't exist yet.
 */
export function buildNetWorth(
  wallets: WalletWithBalance[],
  transactions: Transaction[],
  rates: ExchangeRates,
  months: string[]
): { month: string; value: number }[] {
  const firstMonth = new Map<string, string>();
  const flowsByMonth = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    const month = monthKeyFromDate(t.date);
    for (const [walletId, delta] of walletFlows(t)) {
      if (!firstMonth.has(walletId) || month < firstMonth.get(walletId)!) firstMonth.set(walletId, month);
      const flows = flowsByMonth.get(month) ?? new Map<string, number>();
      flows.set(walletId, (flows.get(walletId) ?? 0) + delta);
      flowsByMonth.set(month, flows);
    }
  }

  const balance = new Map(wallets.map((w) => [w.id, w.currentBalance]));
  // Undo everything dated after the last charted month (e.g. future-dated entries).
  const last = months[months.length - 1];
  for (const [month, flows] of flowsByMonth) {
    if (month > last) for (const [id, delta] of flows) balance.set(id, (balance.get(id) ?? 0) - delta);
  }

  const points: { month: string; value: number }[] = [];
  for (let i = months.length - 1; i >= 0; i--) {
    const month = months[i];
    const usd = wallets.reduce((sum, w) => {
      const started = firstMonth.get(w.id);
      if (started && started > month) return sum;
      return sum + convertToUsd(balance.get(w.id) ?? 0, w.currencyCode, rates);
    }, 0);
    points.push({ month, value: usd * rates.usdToIdr });
    for (const [id, delta] of flowsByMonth.get(month) ?? []) balance.set(id, (balance.get(id) ?? 0) - delta);
  }
  return points.reverse();
}

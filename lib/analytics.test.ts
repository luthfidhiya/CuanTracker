import { describe, expect, it } from "vitest";
import { buildDetailedStats, sumIncomeExpense, totalBalance } from "./analytics";
import type { ExchangeRates } from "./exchange";
import type { Category, Transaction, WalletWithBalance } from "./types";

const rates: ExchangeRates = { usdToIdr: 16000, btcToUsd: 60000, ethToUsd: 3000, usdcToUsd: 1, estimated: false };

const wallet = (id: string, currencyCode: string, currentBalance = 0): WalletWithBalance => ({
  id,
  name: id.toUpperCase(),
  type: "Bank",
  initialBalance: 0,
  color: `#00000${id.length}`,
  currencyCode,
  currencySymbol: "",
  currentBalance,
});

const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  date: "2026-10-01",
  amount: 0,
  type: "EXPENSE",
  category: "",
  description: "",
  walletId: "idr",
  ...p,
});

const wallets = [wallet("idr", "IDR", 1_600_000), wallet("usd", "USD", 100)];

describe("sumIncomeExpense", () => {
  it("normalizes to IDR and ignores transfers", () => {
    const totals = sumIncomeExpense(
      [
        tx({ type: "INCOME", amount: 10, walletId: "usd" }),
        tx({ type: "EXPENSE", amount: 50_000 }),
        tx({ type: "TRANSFER", amount: 999_999, toWalletId: "usd" }),
      ],
      wallets,
      rates
    );
    expect(totals).toEqual({ income: 160_000, expense: 50_000 });
  });
});

describe("totalBalance", () => {
  it("sums every wallet in USD and IDR", () => {
    expect(totalBalance(wallets, rates)).toEqual({ usd: 200, idr: 3_200_000 });
  });
});

describe("buildDetailedStats", () => {
  const categories: Category[] = [
    { id: "c1", name: "Makan", type: "EXPENSE", color: "#ff0000" },
    { id: "c2", name: "Gaji", type: "INCOME", color: "#00ff00" },
  ];

  const stats = buildDetailedStats(
    [
      tx({ date: "2026-12-05", type: "EXPENSE", amount: 30_000, category: "Makan" }),
      tx({ date: "2027-01-02", type: "INCOME", amount: 1_000_000, category: "Gaji" }),
      tx({ date: "2027-01-03", type: "EXPENSE", amount: 20_000, category: "Makan" }),
      tx({ date: "2027-01-04", type: "EXPENSE", amount: 5_000, category: "Parkir" }),
    ],
    wallets,
    categories,
    rates,
    { from: "2026-11-01", to: "2027-01-31" }
  );

  it("charts every month in the range chronologically, empty ones as zero", () => {
    expect(stats.trend.granularity).toBe("month");
    expect(stats.trend.points.map((p) => p.key)).toEqual(["2026-11", "2026-12", "2027-01"]);
    expect(stats.trend.points[0]).toEqual({ key: "2026-11", income: 0, expense: 0 });
    expect(stats.trend.points[2]).toEqual({ key: "2027-01", income: 1_000_000, expense: 25_000 });
  });

  it("charts a single-month range per day", () => {
    const daily = buildDetailedStats(
      [tx({ date: "2027-01-03", amount: 20_000 })],
      wallets,
      categories,
      rates,
      { from: "2027-01-01", to: "2027-01-05" }
    );
    expect(daily.trend.granularity).toBe("day");
    expect(daily.trend.points.map((p) => p.key)).toEqual([
      "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05",
    ]);
    expect(daily.trend.points[2].expense).toBe(20_000);
  });

  it("breaks income down by category with its color", () => {
    expect(stats.incomeByCategory).toEqual([{ name: "Gaji", value: 1_000_000, color: "#00ff00" }]);
  });

  it("uses the category's own color, with a fallback for unknown ones", () => {
    expect(stats.expenseByCategory[0]).toEqual({ name: "Makan", value: 50_000, color: "#ff0000" });
    expect(stats.expenseByCategory[1].name).toBe("Parkir");
    expect(stats.expenseByCategory[1].color).toMatch(/^#/);
  });

  it("totals income and expense", () => {
    expect(stats.totalIncome).toBe(1_000_000);
    expect(stats.totalExpense).toBe(55_000);
  });
});

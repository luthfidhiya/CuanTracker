import { describe, expect, it } from "vitest";
import { planTransactionEdit } from "./data/transactions";
import { formatAmountInput, formatMoney, parseAmountInput } from "./money";
import { transactionSchema, walletCreateSchema } from "./validation";

const base = {
  date: "2026-10-05",
  amount: 45000,
  type: "EXPENSE" as const,
  category: "Makan",
  description: "",
  walletId: "w1",
};

describe("transactionSchema", () => {
  it("accepts a normal expense and drops a stray transfer target", () => {
    const parsed = transactionSchema.parse({ ...base, toWalletId: "" });
    expect(parsed.toWalletId).toBeUndefined();
  });

  it("requires a category for income and expense", () => {
    expect(transactionSchema.safeParse({ ...base, category: "" }).success).toBe(false);
  });

  it("requires a different target wallet for transfers and clears the category", () => {
    const transfer = { ...base, type: "TRANSFER" as const, category: "Makan" };
    expect(transactionSchema.safeParse({ ...transfer, toWalletId: "" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...transfer, toWalletId: "w1" }).success).toBe(false);
    expect(transactionSchema.parse({ ...transfer, toWalletId: "w2" }).category).toBe("");
  });

  it("rejects non-positive amounts and invalid dates", () => {
    expect(transactionSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, amount: Number.NaN }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, date: "2026-02-30" }).success).toBe(false);
  });
});

describe("walletCreateSchema", () => {
  it("only allows known currencies and wallet types", () => {
    const wallet = { name: "BCA", type: "Bank", initialBalance: 0, color: "#3b82f6", currencyCode: "IDR" };
    expect(walletCreateSchema.safeParse(wallet).success).toBe(true);
    expect(walletCreateSchema.safeParse({ ...wallet, currencyCode: "XYZ" }).success).toBe(false);
    expect(walletCreateSchema.safeParse({ ...wallet, type: "Kartu" }).success).toBe(false);
  });
});

describe("planTransactionEdit", () => {
  it("edits in place within the same month", () => {
    expect(planTransactionEdit("2026-10-01", "2026-10-31")).toEqual({
      kind: "in-place",
      sheet: "Transactions_Oct2026",
    });
  });

  it("moves the row when the month changes", () => {
    expect(planTransactionEdit("2026-09-30", "2026-10-02")).toEqual({
      kind: "move",
      from: "Transactions_Sep2026",
      to: "Transactions_Oct2026",
      toMonth: "2026-10",
    });
  });
});

describe("amount input", () => {
  it("parses id-ID formatted input", () => {
    expect(parseAmountInput("1.250.000")).toBe(1_250_000);
    expect(parseAmountInput("12,5")).toBe(12.5);
    expect(parseAmountInput("")).toBe(0);
  });

  it("formats while typing", () => {
    expect(formatAmountInput("1250000")).toBe("1.250.000");
    expect(formatAmountInput("1.250,")).toBe("1.250,");
    expect(formatAmountInput("abc")).toBe("");
  });

  it("formats per currency precision", () => {
    expect(formatMoney(45000, "IDR")).toBe("Rp 45.000");
    expect(formatMoney(12.5, "USD")).toBe("$ 12,50");
    expect(formatMoney(0.000123, "BTC")).toBe("₿ 0,000123");
  });
});

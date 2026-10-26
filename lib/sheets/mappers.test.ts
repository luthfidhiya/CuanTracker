import { describe, expect, it } from "vitest";
import {
  escapeText,
  parseSheetDate,
  rowToTransaction,
  rowToWallet,
  rowsToTransactions,
  transactionToRow,
} from "./mappers";

describe("parseSheetDate", () => {
  it("converts spreadsheet serial numbers", () => {
    expect(parseSheetDate(46300)).toBe("2026-10-05");
    expect(parseSheetDate(45658)).toBe("2025-01-01");
  });

  it("keeps text dates and handles empty cells", () => {
    expect(parseSheetDate("2026-10-05")).toBe("2026-10-05");
    expect(parseSheetDate("")).toBe("");
    expect(parseSheetDate(undefined)).toBe("");
  });
});

describe("rowToWallet", () => {
  it("keeps a zero balance from the formula column", () => {
    const w = rowToWallet(["w1", "BCA", "Bank", 500, "#3b82f6", "IDR", "Rp", 0]);
    expect(w.currentBalance).toBe(0);
  });

  it("falls back to the initial balance when the formula cell is empty or broken", () => {
    expect(rowToWallet(["w1", "BCA", "Bank", 500, "#fff", "IDR", "Rp"]).currentBalance).toBe(500);
    expect(rowToWallet(["w1", "BCA", "Bank", 500, "#fff", "IDR", "Rp", "#REF!"]).currentBalance).toBe(500);
  });

  it("defaults the currency to IDR", () => {
    const w = rowToWallet(["w1", "Cash", "Cash", 0, "#fff"]);
    expect(w.currencyCode).toBe("IDR");
    expect(w.currencySymbol).toBe("Rp");
  });
});

describe("transactions", () => {
  it("does not turn empty cells into the text 'undefined'", () => {
    const t = rowToTransaction(["t1", "2026-10-01", 1000, "EXPENSE"]);
    expect(t.category).toBe("");
    expect(t.description).toBe("");
    expect(t.walletId).toBe("");
    expect(t.toWalletId).toBeUndefined();
  });

  it("sorts newest date first and keeps later rows first within a day", () => {
    const list = rowsToTransactions([
      ["a", "2026-10-01", 1, "EXPENSE"],
      ["b", "2026-10-03", 1, "EXPENSE"],
      ["c", "2026-10-01", 1, "EXPENSE"],
      ["", "", "", ""], // blank row left by manual editing
    ]);
    expect(list.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("writes columns in the sheet's order", () => {
    expect(
      transactionToRow({
        id: "t1",
        date: "2026-10-01",
        amount: 25000,
        type: "TRANSFER",
        category: "",
        description: "Top up",
        walletId: "w1",
        toWalletId: "w2",
      })
    ).toEqual(["t1", "2026-10-01", 25000, "TRANSFER", "", "Top up", "w1", "w2"]);
  });
});

describe("escapeText", () => {
  it("stops user text from being evaluated as a formula", () => {
    expect(escapeText("=IMPORTXML(A1)")).toBe("'=IMPORTXML(A1)");
    expect(escapeText("-diskon")).toBe("'-diskon");
    expect(escapeText("Makan siang")).toBe("Makan siang");
  });
});

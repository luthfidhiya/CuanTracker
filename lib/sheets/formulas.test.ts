import { describe, expect, it } from "vitest";
import { walletBalanceFormula } from "./formulas";

/** Verbatim copy of the formula builder from the old lib/google.ts updateWalletFormulas. */
function legacyFormula(rowNum: number, transactionSheets: string[]) {
  let formula = `=D${rowNum}`;
  if (transactionSheets.length > 0) {
    for (const sheetName of transactionSheets) {
      formula += ` + SUMPRODUCT((${sheetName}!D$2:D$9999="INCOME") * (${sheetName}!G$2:G$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
      formula += ` - SUMPRODUCT((${sheetName}!D$2:D$9999="EXPENSE") * (${sheetName}!G$2:G$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
      formula += ` - SUMPRODUCT((${sheetName}!D$2:D$9999="TRANSFER") * (${sheetName}!G$2:G$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
      formula += ` + SUMPRODUCT((${sheetName}!D$2:D$9999="TRANSFER") * (${sheetName}!H$2:H$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
    }
  }
  return formula;
}

describe("walletBalanceFormula", () => {
  it("is identical to the formula existing spreadsheets already contain", () => {
    const sheets = ["Transactions_Sep2026", "Transactions_Oct2026"];
    for (const row of [2, 3, 10]) {
      expect(walletBalanceFormula(row, sheets)).toBe(legacyFormula(row, sheets));
    }
  });

  it("is just the initial balance without transaction sheets", () => {
    expect(walletBalanceFormula(2, [])).toBe("=D2");
  });
});

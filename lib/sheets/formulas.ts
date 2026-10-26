// Wallet balances live in Wallets!H as a formula summing every transaction
// sheet, so the spreadsheet stays correct even when edited by hand.

const LAST_ROW = 9999;

function sumWhere(sheet: string, type: string, walletColumn: "G" | "H", rowNum: number) {
  return (
    `SUMPRODUCT((${sheet}!D$2:D$${LAST_ROW}="${type}") * ` +
    `(${sheet}!${walletColumn}$2:${walletColumn}$${LAST_ROW}=A${rowNum}) * ` +
    `${sheet}!C$2:C$${LAST_ROW})`
  );
}

/**
 * Balance formula for the wallet on spreadsheet row `rowNum`:
 * initial balance + income - expense - transfers out + transfers in.
 */
export function walletBalanceFormula(rowNum: number, transactionSheets: string[]): string {
  let formula = `=D${rowNum}`;
  for (const sheet of transactionSheets) {
    formula += ` + ${sumWhere(sheet, "INCOME", "G", rowNum)}`;
    formula += ` - ${sumWhere(sheet, "EXPENSE", "G", rowNum)}`;
    formula += ` - ${sumWhere(sheet, "TRANSFER", "G", rowNum)}`;
    formula += ` + ${sumWhere(sheet, "TRANSFER", "H", rowNum)}`;
  }
  return formula;
}

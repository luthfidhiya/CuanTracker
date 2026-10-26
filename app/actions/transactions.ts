"use server";

import { updateTag } from "next/cache";
import { tags } from "@/lib/data/tags";
import {
  insertTransaction,
  removeTransaction,
  replaceTransaction,
} from "@/lib/data/transactions";
import { listWallets } from "@/lib/data/wallets";
import { UserError } from "@/lib/errors";
import { runMutation, type ActionResult } from "@/lib/server/action";
import { monthKeyFromDate } from "@/lib/sheets/schema";
import type { Transaction } from "@/lib/types";
import {
  transactionRefSchema,
  transactionSchema,
  type TransactionInput,
} from "@/lib/validation";

async function parseTransaction(input: TransactionInput) {
  const data = transactionSchema.parse(input);
  const wallets = await listWallets();
  const from = wallets.find((w) => w.id === data.walletId);
  if (!from) throw new UserError("Dompet tidak ditemukan");
  if (data.toWalletId) {
    const to = wallets.find((w) => w.id === data.toWalletId);
    if (!to) throw new UserError("Dompet tujuan tidak ditemukan");
    if (to.currencyCode !== from.currencyCode) {
      throw new UserError("Transfer hanya bisa antar dompet dengan mata uang yang sama");
    }
  }
  return data;
}

function invalidate(...dates: string[]) {
  updateTag(tags.wallets); // balances are formulas over all transactions
  updateTag(tags.transactions);
  for (const date of dates) updateTag(tags.month(monthKeyFromDate(date)));
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  return runMutation(async () => {
    const data = await parseTransaction(input);
    const tx: Transaction = { id: crypto.randomUUID(), ...data };
    await insertTransaction(tx);
    invalidate(tx.date);
  });
}

export async function updateTransaction(
  ref: { id: string; date: string },
  input: TransactionInput
): Promise<ActionResult> {
  return runMutation(async () => {
    const { id, date: originalDate } = transactionRefSchema.parse(ref);
    const data = await parseTransaction(input);
    await replaceTransaction(originalDate, { id, ...data });
    invalidate(originalDate, data.date);
  });
}

export async function deleteTransaction(ref: { id: string; date: string }): Promise<ActionResult> {
  return runMutation(async () => {
    const { id, date } = transactionRefSchema.parse(ref);
    await removeTransaction(id, date);
    invalidate(date);
  });
}

"use server";

import { updateTag } from "next/cache";
import { getCurrency } from "@/lib/currencies";
import { tags } from "@/lib/data/tags";
import { countWalletTransactions } from "@/lib/data/transactions";
import { insertWallet, removeWallet, updateWallet as writeWallet } from "@/lib/data/wallets";
import { requireAuth, runMutation, type ActionResult } from "@/lib/server/action";
import {
  idSchema,
  walletCreateSchema,
  walletUpdateSchema,
  type WalletCreateInput,
  type WalletUpdateInput,
} from "@/lib/validation";

export async function createWallet(input: WalletCreateInput): Promise<ActionResult> {
  return runMutation(async () => {
    const data = walletCreateSchema.parse(input);
    await insertWallet({
      id: crypto.randomUUID(),
      ...data,
      // Derived on the server so the symbol always matches the currency code.
      currencySymbol: getCurrency(data.currencyCode).symbol,
    });
    updateTag(tags.wallets);
  });
}

export async function updateWallet(id: string, input: WalletUpdateInput): Promise<ActionResult> {
  return runMutation(async () => {
    await writeWallet(idSchema.parse(id), walletUpdateSchema.parse(input));
    updateTag(tags.wallets);
  });
}

/** How many transactions (including transfers) a wallet delete would remove. */
export async function getWalletDeleteImpact(id: string): Promise<number> {
  await requireAuth();
  return countWalletTransactions(idSchema.parse(id));
}

/** Also deletes every transaction of the wallet, including transfers to and from it. */
export async function deleteWallet(id: string): Promise<ActionResult> {
  return runMutation(async () => {
    await removeWallet(idSchema.parse(id));
    updateTag(tags.wallets);
    updateTag(tags.transactions);
  });
}

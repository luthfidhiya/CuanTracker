import { toIdr } from "./analytics";
import type { ExchangeRates } from "./exchange";
import type { Transaction, Wallet } from "./types";

export type Tone = "income" | "expense" | "transfer";

export interface TransactionView {
  title: string;
  subtitle: string;
  tone: Tone;
  currency: string;
}

/**
 * How a transaction reads in a list. With `walletId`, transfers are shown from
 * that wallet's side (money in or out); otherwise as a neutral move.
 */
export function describeTransaction(
  t: Transaction,
  wallets: Map<string, Wallet>,
  walletId?: string
): TransactionView {
  const from = wallets.get(t.walletId);
  const currency = from?.currencyCode || "IDR";
  const note = t.description;

  if (t.type === "TRANSFER") {
    const to = wallets.get(t.toWalletId ?? "");
    const fromName = from?.name ?? "Dompet terhapus";
    const toName = to?.name ?? "Dompet terhapus";
    if (walletId && walletId === t.toWalletId) {
      return { title: "Transfer masuk", subtitle: joinParts(`dari ${fromName}`, note), tone: "income", currency };
    }
    if (walletId && walletId === t.walletId) {
      return { title: "Transfer keluar", subtitle: joinParts(`ke ${toName}`, note), tone: "expense", currency };
    }
    return { title: "Transfer", subtitle: joinParts(`${fromName} → ${toName}`, note), tone: "transfer", currency };
  }

  return {
    title: t.category || (t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"),
    subtitle: walletId ? note : joinParts(from?.name ?? "Dompet terhapus", note),
    tone: t.type === "INCOME" ? "income" : "expense",
    currency,
  };
}

function joinParts(...parts: string[]) {
  return parts.filter(Boolean).join(" · ");
}

export interface DayGroup {
  date: string;
  items: Transaction[];
}

/** Consecutive transactions grouped by date; input is expected newest first. */
export function groupByDate(transactions: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const t of transactions) {
    const last = groups.at(-1);
    if (last?.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }
  return groups;
}

/**
 * Net change for a set of transactions. For one wallet it is in that wallet's
 * currency and includes transfers; across wallets it is in IDR and transfers
 * cancel out, so they are skipped.
 */
export function netAmount(
  transactions: Transaction[],
  wallets: Map<string, Wallet>,
  rates: ExchangeRates,
  walletId?: string
): number {
  let net = 0;
  for (const t of transactions) {
    if (walletId) {
      const tone = describeTransaction(t, wallets, walletId).tone;
      net += tone === "income" ? t.amount : tone === "expense" ? -t.amount : 0;
    } else if (t.type !== "TRANSFER") {
      const idr = toIdr(t.amount, wallets.get(t.walletId)?.currencyCode || "IDR", rates);
      net += t.type === "INCOME" ? idr : -idr;
    }
  }
  return net;
}

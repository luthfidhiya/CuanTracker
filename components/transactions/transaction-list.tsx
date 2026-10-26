"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Sheet } from "@/components/ui/sheet";
import type { ExchangeRates } from "@/lib/exchange";
import { formatDayHeading } from "@/lib/format-date";
import { describeTransaction, groupByDate, netAmount, type Tone } from "@/lib/transaction-view";
import type { Category, Transaction, Wallet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TransactionForm } from "./transaction-form";

const toneIcon: Record<Tone, React.ReactNode> = {
  income: <ArrowDownLeft className="size-4" />,
  expense: <ArrowUpRight className="size-4" />,
  transfer: <ArrowLeftRight className="size-4" />,
};

const toneBg: Record<Tone, string> = {
  income: "bg-income/12 text-income",
  expense: "bg-expense/12 text-expense",
  transfer: "bg-surface-2 text-transfer",
};

/**
 * Transactions grouped by day with a daily net. Tapping a row opens it for
 * editing (delete lives inside the edit form).
 * With `walletId` the list is shown from that wallet's side.
 */
export function TransactionList({
  transactions,
  wallets,
  categories,
  rates,
  walletId,
  grouped = true,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  rates: ExchangeRates;
  walletId?: string;
  grouped?: boolean;
}) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [recording, setRecording] = useState<Transaction | null>(null);
  const walletById = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);
  const groups = grouped ? groupByDate(transactions) : [{ date: "", items: transactions }];
  const netCurrency = walletId ? walletById.get(walletId)?.currencyCode : "IDR";

  return (
    <>
      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.date || "all"}>
            {grouped && (
              <div className="mb-1.5 flex items-baseline justify-between px-1 text-xs">
                <h3 className="font-medium text-muted">{formatDayHeading(group.date)}</h3>
                <Amount
                  value={netAmount(group.items, walletById, rates, walletId)}
                  currency={netCurrency}
                  className="text-subtle"
                />
              </div>
            )}
            <ul className="divide-y divide-border overflow-hidden rounded-(--radius-card) border border-border bg-surface">
              {group.items.map((t) => {
                const view = describeTransaction(t, walletById, walletId);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", toneBg[view.tone])}>
                        {toneIcon[view.tone]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{view.title}</span>
                        {view.subtitle && (
                          <span className="block truncate text-xs text-muted">{view.subtitle}</span>
                        )}
                      </span>
                      <Amount
                        value={t.amount}
                        currency={view.currency}
                        tone={view.tone === "transfer" ? "neutral" : view.tone}
                        className="text-sm font-medium"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <Sheet open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title="Ubah transaksi">
        {editing && (
          <TransactionForm
            key={editing.id}
            wallets={wallets}
            categories={categories}
            initial={editing}
            onRecordAgain={(t) => {
              setEditing(null);
              setRecording(t);
            }}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>

      <Sheet open={!!recording} onOpenChange={(open) => !open && setRecording(null)} title="Catat lagi">
        {recording && (
          <TransactionForm
            key={recording.id}
            wallets={wallets}
            categories={categories}
            template={recording}
            onDone={() => setRecording(null)}
          />
        )}
      </Sheet>
    </>
  );
}

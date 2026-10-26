import { Amount } from "@/components/ui/amount";
import { CurrencyMark } from "@/components/ui/currency-mark";
import type { WalletWithBalance } from "@/lib/types";

/** Balances per currency: adding BTC to rupiah would need rates and hide the real amounts. */
function totalsByCurrency(wallets: WalletWithBalance[]) {
  const totals = new Map<string, number>();
  for (const w of wallets) totals.set(w.currencyCode, (totals.get(w.currencyCode) ?? 0) + w.currentBalance);
  return [...totals.entries()];
}

/** One line per currency so long amounts never get cut off on phones. */
export function CurrencyTotals({ wallets }: { wallets: WalletWithBalance[] }) {
  return (
    <ul className="divide-y divide-border rounded-(--radius-card) border border-border bg-surface">
      {totalsByCurrency(wallets).map(([code, value]) => (
        <li key={code} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="inline-flex w-6 justify-center">
              <CurrencyMark code={code} badge />
            </span>
            {code}
          </span>
          <Amount value={value} currency={code} className="whitespace-normal wrap-anywhere text-right font-medium" />
        </li>
      ))}
    </ul>
  );
}

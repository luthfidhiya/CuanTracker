import { CurrencyMark } from "@/components/ui/currency-mark";
import { RatesNotice } from "@/components/ui/rates-notice";
import type { ExchangeRates as Rates } from "@/lib/exchange";
import { formatMoney } from "@/lib/money";

/** The rates every rupiah total is converted with, so the numbers can be checked. */
export function ExchangeRates({ rates }: { rates: Rates }) {
  // Rupiah first since that's what totals are shown in; dollar prices underneath for crypto.
  const idr = (usd: number) => formatMoney(Math.round(usd * rates.usdToIdr), "IDR");
  const rows = [
    { code: "USD", idr: formatMoney(rates.usdToIdr, "IDR") },
    { code: "USDC", idr: idr(rates.usdcToUsd), usd: formatMoney(rates.usdcToUsd, "USD") },
    { code: "BTC", idr: idr(rates.btcToUsd), usd: formatMoney(rates.btcToUsd, "USD") },
    { code: "ETH", idr: idr(rates.ethToUsd), usd: formatMoney(rates.ethToUsd, "USD") },
  ];
  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        {rows.map((r) => (
          <li key={r.code} className="rounded-(--radius-card) border border-border bg-surface px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="inline-flex w-4 justify-center">
                <CurrencyMark code={r.code} badge />
              </span>
              1 {r.code}
            </p>
            <p className="tabular mt-1 text-sm font-medium wrap-anywhere">{r.idr}</p>
            {r.usd && <p className="tabular text-xs text-subtle wrap-anywhere">{r.usd}</p>}
          </li>
        ))}
      </ul>
      <RatesNotice rates={rates} />
    </div>
  );
}

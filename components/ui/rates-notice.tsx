import { TriangleAlert } from "lucide-react";
import type { ExchangeRates } from "@/lib/exchange";

/** Shown wherever amounts are converted, when the rates are not live. */
export function RatesNotice({ rates }: { rates: ExchangeRates }) {
  if (!rates.estimated) return null;
  return (
    <p role="status" className="flex items-start gap-2 text-xs text-muted">
      <TriangleAlert className="mt-px size-3.5 shrink-0 text-expense" aria-hidden />
      Kurs perkiraan: layanan kurs sedang tidak bisa dihubungi, jadi konversi ke rupiah memakai kurs terakhir
      yang tersedia. Saldo per dompet tetap akurat.
    </p>
  );
}

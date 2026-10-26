import Link from "next/link";
import { Nfc } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import type { WalletWithBalance } from "@/lib/types";
import { walletTypeLabel } from "@/lib/wallet-types";

const FALLBACK_COLOR = "#64748b";

/**
 * A card tinted by the wallet's color rather than filled with it, so it sits
 * calmly in the dark theme while each wallet stays recognizable.
 */
function cardStyle(color: string): React.CSSProperties {
  const c = color || FALLBACK_COLOR;
  return {
    backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${c} 26%, var(--color-surface)) 0%, color-mix(in srgb, ${c} 6%, var(--color-surface)) 70%)`,
    borderColor: `color-mix(in srgb, ${c} 30%, var(--color-border))`,
  };
}

/** Wallets page grid: each wallet drawn as a card, two per row on phones. */
export function WalletCards({ wallets }: { wallets: WalletWithBalance[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {wallets.map((w) => {
        const color = w.color || FALLBACK_COLOR;
        return (
          <li key={w.id}>
            <Link
              href={`/wallets/${w.id}`}
              style={cardStyle(color)}
              className="relative flex h-full flex-col overflow-hidden rounded-xl border p-3.5 transition-[transform,filter] hover:brightness-110 active:scale-[0.98] sm:p-4"
            >
              {/* faint ring in the corner, the usual card decoration */}
              <span
                className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full border-[14px] opacity-15"
                style={{ borderColor: color }}
                aria-hidden
              />

              <div className="relative flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-[11px] font-medium uppercase tracking-wider text-muted">
                  {walletTypeLabel(w.type)}
                  {w.currencyCode !== "IDR" && ` · ${w.currencyCode}`}
                </p>
                <Nfc className="size-4 shrink-0" style={{ color }} aria-hidden />
              </div>
              <p className="relative mt-1 line-clamp-2 break-words text-sm font-semibold leading-snug sm:text-base">
                {w.name}
              </p>

              <Amount
                value={w.currentBalance}
                currency={w.currencyCode}
                className="relative mt-auto block whitespace-normal wrap-anywhere pt-2.5 text-base font-semibold leading-tight sm:text-lg"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

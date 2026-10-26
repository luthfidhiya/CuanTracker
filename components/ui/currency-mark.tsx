import { getCurrency } from "@/lib/currencies";
import { cn } from "@/lib/utils";

/** Currency logos drawn on a 24×24 grid. */
const ICONS: Record<string, { color: string; glyph: React.ReactNode }> = {
  IDR: {
    color: "#D9434B",
    glyph: (
      <text x="12" y="15.4" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" fontFamily="inherit">
        Rp
      </text>
    ),
  },
  USD: {
    color: "#2E9E6A",
    glyph: (
      <path
        d="M14.9 9.2c0-1.4-1.3-2.3-2.9-2.3s-2.9.9-2.9 2.3c0 3 5.9 1.5 5.9 4.7 0 1.5-1.3 2.3-3 2.3s-3-1-3-2.3M12 5.2v1.7m0 9.4v1.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    ),
  },
  BTC: {
    color: "#F7931A",
    glyph: (
      <g transform="rotate(14 12 12)" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        <path d="M9 6.2h4.1a2.7 2.7 0 0 1 0 5.4H9m0 0h4.7a3.1 3.1 0 0 1 0 6.2H9V6.2M7.6 6.2H9m-1.4 11.6H9" />
        <path d="M10.6 4.6v1.6m2.4-1.6v1.6m-2.4 11.6v1.6m2.4-1.6v1.6" />
      </g>
    ),
  },
  ETH: {
    color: "#627EEA",
    glyph: (
      <g fill="#fff">
        <path d="M12 4 7.5 12.2 12 14.8z" />
        <path d="M12 4l4.5 8.2L12 14.8z" opacity=".65" />
        <path d="M12 15.7 7.5 13.1 12 20z" />
        <path d="M12 15.7l4.5-2.6L12 20z" opacity=".65" />
      </g>
    ),
  },
  USDC: {
    color: "#2775CA",
    glyph: (
      <g fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round">
        <path d="M14.5 9.7c0-1.1-1-1.8-2.5-1.8s-2.5.7-2.5 1.8c0 2.6 5.2 1.3 5.2 4.1 0 1.2-1.1 1.9-2.7 1.9s-2.7-.8-2.7-1.9M12 6.4v1.5m0 7.6v1.6" />
        <path d="M8.6 5.8a7.2 7.2 0 0 0 0 12.4m6.8-12.4a7.2 7.2 0 0 1 0 12.4" />
      </g>
    ),
  },
};

/**
 * Rp and $ read fine as text, so inside amounts only crypto gets its logo;
 * labels (rates, per-currency totals) pass `badge` to show every logo.
 */
const TEXT_IN_AMOUNTS = new Set(["IDR", "USD"]);

export function hasCurrencyIcon(code: string) {
  return code in ICONS && !TEXT_IN_AMOUNTS.has(code);
}

/** Left padding for an amount input that shows the mark as a prefix. */
export function markPadding(code: string) {
  return hasCurrencyIcon(code) ? "2.25rem" : `${1.5 + getCurrency(code).symbol.length * 0.6}rem`;
}

/** The currency's mark: a small logo for crypto (any currency with `badge`), the text symbol otherwise. */
export function CurrencyMark({ code, badge = false, className }: { code: string; badge?: boolean; className?: string }) {
  const icon = badge || hasCurrencyIcon(code) ? ICONS[code] : undefined;
  if (!icon) return <span className={className}>{getCurrency(code).symbol}</span>;
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={code}
      className={cn("inline-block size-[1em] shrink-0 align-[-0.125em]", className)}
    >
      <circle cx="12" cy="12" r="12" fill={icon.color} />
      {icon.glyph}
    </svg>
  );
}

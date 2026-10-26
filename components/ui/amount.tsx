"use client";

import { formatMoney, formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useAmountsHidden } from "@/components/privacy";
import { CurrencyMark, hasCurrencyIcon } from "./currency-mark";

export type AmountTone = "income" | "expense" | "transfer" | "neutral";

const toneClass: Record<AmountTone, string> = {
  income: "text-income",
  expense: "text-expense",
  transfer: "text-transfer",
  neutral: "",
};

const signFor: Record<AmountTone, string> = {
  income: "+",
  expense: "−",
  transfer: "",
  neutral: "",
};

/** A money value that respects privacy mode. `tone` adds the matching sign and color. */
export function Amount({
  value,
  currency = "IDR",
  tone = "neutral",
  className,
}: {
  value: number;
  currency?: string;
  tone?: AmountTone;
  className?: string;
}) {
  const hidden = useAmountsHidden();
  const sign = value < 0 ? "−" : signFor[tone];
  const classes = cn("tabular whitespace-nowrap", toneClass[tone], className);
  if (hidden) return <span className={classes}>••••••</span>;
  if (hasCurrencyIcon(currency)) {
    return (
      <span className={classes}>
        {sign}
        <CurrencyMark code={currency} className="mr-[0.3em]" />
        {formatNumber(Math.abs(value), currency)}
      </span>
    );
  }
  return <span className={classes}>{`${sign}${formatMoney(Math.abs(value), currency)}`}</span>;
}

/** Wraps content (e.g. a chart) that should be obscured in privacy mode. */
export function PrivacyBlur({ children, className }: { children: React.ReactNode; className?: string }) {
  const hidden = useAmountsHidden();
  return (
    <div className={cn("transition-[filter]", hidden && "pointer-events-none blur-md", className)} aria-hidden={hidden || undefined}>
      {children}
    </div>
  );
}

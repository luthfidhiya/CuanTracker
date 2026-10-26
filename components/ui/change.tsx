import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { percentChange } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * "↑ 12% vs Sep". `goodWhen` sets the color: more income is good, more
 * spending is not.
 */
export function Change({
  current,
  previous,
  goodWhen,
  against,
}: {
  current: number;
  previous: number;
  goodWhen: "up" | "down";
  /** Short name of the compared period, e.g. "Sep". */
  against: string;
}) {
  const change = percentChange(current, previous);
  if (change === null) {
    return <p className="mt-1 text-xs text-subtle">Belum ada data {against}</p>;
  }
  const rounded = Math.round(change);
  if (rounded === 0) return <p className="mt-1 text-xs text-subtle">Sama dgn {against}</p>;

  const up = rounded > 0;
  const good = up === (goodWhen === "up");
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs">
      <span className={cn("tabular inline-flex items-center font-medium", good ? "text-income" : "text-expense")}>
        <Arrow className="size-3.5" aria-hidden />
        {Math.abs(rounded).toLocaleString("id-ID")}%
      </span>
      <span className="text-subtle">vs {against}</span>
    </p>
  );
}

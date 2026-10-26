import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth } from "@/lib/format-date";
import { currentMonthKey, shiftMonth, type MonthKey } from "@/lib/sheets/schema";
import { buttonStyles } from "./button";

/**
 * ‹ Oktober 2026 › — month is carried in the URL (?month=yyyy-MM).
 * Future months can't hold transactions yet, so "next" stops at this month,
 * and a "Bulan ini" shortcut appears once you've gone back.
 */
export function MonthNav({ month, basePath }: { month: MonthKey; basePath: string }) {
  const href = (m: MonthKey) => `${basePath}?month=${m}`;
  const current = currentMonthKey();
  const atCurrent = month >= current;
  const arrow = buttonStyles({ variant: "ghost", size: "icon" });

  return (
    <div className="flex items-center gap-1">
      <Link href={href(shiftMonth(month, -1))} replace scroll={false} className={arrow} aria-label="Bulan sebelumnya">
        <ChevronLeft className="size-5" />
      </Link>
      <span className="min-w-36 text-center text-sm font-medium">{formatMonth(month)}</span>
      {atCurrent ? (
        <span className={`${arrow} pointer-events-none opacity-30`} aria-hidden>
          <ChevronRight className="size-5" />
        </span>
      ) : (
        <Link href={href(shiftMonth(month, 1))} replace scroll={false} className={arrow} aria-label="Bulan berikutnya">
          <ChevronRight className="size-5" />
        </Link>
      )}
      {month !== current && (
        <Link
          href={href(current)}
          replace
          scroll={false}
          className={buttonStyles({ variant: "ghost", size: "sm", className: "text-accent" })}
        >
          Bulan ini
        </Link>
      )}
    </div>
  );
}

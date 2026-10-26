"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firstDayOfMonth, monthKeyFromDate, shiftMonth } from "@/lib/sheets/schema";
import { cn } from "@/lib/utils";

function presets(today: string) {
  const month = monthKeyFromDate(today);
  return [
    { label: "Bulan ini", from: firstDayOfMonth(month) },
    { label: "3 bulan", from: firstDayOfMonth(shiftMonth(month, -2)) },
    { label: "6 bulan", from: firstDayOfMonth(shiftMonth(month, -5)) },
    { label: "Tahun ini", from: `${month.slice(0, 4)}-01-01` },
  ].map((p) => ({ ...p, to: today }));
}

const chip = "h-8 shrink-0 rounded-full border px-3 text-sm leading-[30px] transition-colors";
const chipIdle = "border-border text-muted hover:border-border-strong hover:text-fg";
const chipActive = "border-fg bg-fg text-bg";

/** Preset chips; custom dates fold out of the last chip so they don't take a row of their own. */
export function RangePicker({ from, to, today, view }: { from: string; to: string; today: string; view: string }) {
  const options = presets(today);
  const custom = !options.some((p) => p.from === from && p.to === to);
  const [editing, setEditing] = useState(custom);

  return (
    <div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {options.map((p) => {
          const active = p.from === from && p.to === to;
          return (
            <Link
              key={p.label}
              href={`/analytics?view=${view}&from=${p.from}&to=${p.to}`}
              replace
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={cn(chip, active ? chipActive : chipIdle)}
            >
              {p.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={editing}
          onClick={() => setEditing((open) => !open)}
          className={cn(chip, "flex cursor-pointer items-center gap-1.5", custom ? chipActive : chipIdle)}
        >
          <CalendarRange className="size-3.5" aria-hidden />
          Atur
        </button>
      </div>
      {editing && (
        <form action="/analytics" className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="view" value={view} />
          <label className="text-sm text-muted">
            <span className="mb-1 block">Dari</span>
            <Input type="date" name="from" defaultValue={from} max={today} className="w-40" />
          </label>
          <label className="text-sm text-muted">
            <span className="mb-1 block">Sampai</span>
            <Input type="date" name="to" defaultValue={to} className="w-40" />
          </label>
          <Button type="submit" variant="secondary">Terapkan</Button>
        </form>
      )}
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-lg bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 flex-1 cursor-pointer whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors",
            value === o.value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
  "#64748b",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  // Keep a color chosen in an older version selectable even if it's not in the palette.
  const colors = PALETTE.includes(value) || !value ? PALETTE : [value, ...PALETTE];
  return (
    <div role="radiogroup" aria-label="Warna" className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className="grid size-8 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow aria-checked:ring-2 aria-checked:ring-fg"
          style={{ backgroundColor: c }}
        >
          {value === c && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  );
}

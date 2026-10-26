import { Amount } from "@/components/ui/amount";
import { Card, ColorDot } from "@/components/ui/misc";
import type { StatItem } from "@/lib/types";

const percent = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

/** Ranked list with proportional bars; easier to compare than slices of a pie. */
export function Breakdown({ title, items, empty }: { title: string; items: StatItem[]; empty: string }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-subtle">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const share = percent(item.value, total);
            return (
              <li key={item.name}>
                <div className="flex items-center gap-2 text-sm">
                  <ColorDot color={item.color} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {/* The amount keeps its full width; the name gives way on narrow screens. */}
                  <Amount value={item.value} className="shrink-0 text-right font-medium" />
                </div>
                <div className="ml-[18px] mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="tabular w-9 text-right text-xs text-subtle">{share.toFixed(0)}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

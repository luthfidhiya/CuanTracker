import Link from "next/link";
import { cn } from "@/lib/utils";

export const ANALYTICS_VIEWS = [
  { value: "flow", label: "Arus kas" },
  { value: "category", label: "Kategori" },
  { value: "wallet", label: "Dompet" },
  { value: "networth", label: "Kekayaan" },
] as const;

export type AnalyticsView = (typeof ANALYTICS_VIEWS)[number]["value"];

export function analyticsView(value: string | undefined): AnalyticsView {
  return ANALYTICS_VIEWS.find((v) => v.value === value)?.value ?? "flow";
}

/** Looks like the Segmented control, but each tab is a link so the view survives a refresh. */
export function ViewTabs({ view, hrefFor }: { view: AnalyticsView; hrefFor: (view: AnalyticsView) => string }) {
  return (
    <nav aria-label="Tampilan analitik" className="flex rounded-lg bg-surface-2 p-1">
      {ANALYTICS_VIEWS.map((v) => (
        <Link
          key={v.value}
          href={hrefFor(v.value)}
          replace
          scroll={false}
          aria-current={v.value === view ? "page" : undefined}
          className={cn(
            "h-8 flex-1 whitespace-nowrap rounded-md px-2 text-center text-sm font-medium leading-8 transition-colors",
            v.value === view ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
          )}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
}

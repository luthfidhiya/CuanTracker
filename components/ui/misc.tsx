import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-(--radius-card) border border-border bg-surface", className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  backHref,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="-ml-2 mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Kembali"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight lg:text-2xl">{title}</h1>
          {description && <div className="mt-0.5 text-sm text-muted">{description}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-surface-2 text-muted [&>svg]:size-5">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}

/** Small colored dot used for wallets and categories. */
export function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color || "var(--color-subtle)" }}
      aria-hidden
    />
  );
}

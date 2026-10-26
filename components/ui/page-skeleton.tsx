import { Skeleton } from "./misc";

/** Loading state shared by the route `loading.tsx` files. */
export function PageSkeleton({ rows = 6, withSummary = false }: { rows?: number; withSummary?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Memuat">
      <Skeleton className="mb-6 h-7 w-40" />
      {withSummary && (
        <div className="mb-6 space-y-3">
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

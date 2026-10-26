import { cn } from "@/lib/utils";

/** The CuanTracker wordmark: gradient italic "Cuan" + plain "Tracker". */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-black italic tracking-tighter text-transparent",
        className
      )}
    >
      Cuan
      <span className="font-bold not-italic text-white">Tracker</span>
    </span>
  );
}

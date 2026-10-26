"use client";

import { Eye, EyeOff } from "lucide-react";
import { setAmountsHidden, useAmountsHidden } from "@/components/privacy";
import { cn } from "@/lib/utils";

export function PrivacyToggle({ withLabel = false, className }: { withLabel?: boolean; className?: string }) {
  const hidden = useAmountsHidden();
  const label = hidden ? "Tampilkan nominal" : "Sembunyikan nominal";
  return (
    <button
      type="button"
      onClick={() => setAmountsHidden(!hidden)}
      aria-pressed={hidden}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg",
        withLabel ? "h-10 w-full px-3" : "size-10 justify-center",
        className
      )}
    >
      {hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      {withLabel && <span>{label}</span>}
    </button>
  );
}

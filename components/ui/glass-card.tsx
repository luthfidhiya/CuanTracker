import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

export function GlassCard({
  className,
  gradient,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md transition-all hover:bg-white/15",
        gradient && "bg-linear-to-br from-white/10 to-white/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

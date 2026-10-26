import Image from "next/image";
import { cn } from "@/lib/utils";
import logo from "@/public/logo.png";
import icon from "@/public/icon-192.png";

/** The CuanTracker wordmark. Size it with a height class (e.g. `h-6`); the width follows. */
export function Logo({ className, preload = false }: { className?: string; preload?: boolean }) {
  return <Image src={logo} alt="CuanTracker" preload={preload} className={cn("h-6 w-auto", className)} />;
}

/** The square app icon (the "C" with a receipt), as used for the favicon and home screen. */
export function LogoIcon({ className }: { className?: string }) {
  return <Image src={icon} alt="" className={cn("size-12", className)} />;
}

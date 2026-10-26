import { ArrowLeftRight, ChartPie, House, Wallet } from "lucide-react";

export const TABS = [
  { href: "/", label: "Ringkasan", icon: House },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/wallets", label: "Dompet", icon: Wallet },
  { href: "/analytics", label: "Analitik", icon: ChartPie },
] as const;

/** Index of the tab a path belongs to (detail pages count as their tab), or -1. */
export function tabIndex(pathname: string): number {
  if (pathname === "/") return 0;
  return TABS.findIndex((t) => t.href !== "/" && (pathname === t.href || pathname.startsWith(`${t.href}/`)));
}

/** Swiping only switches between the top-level tab pages, not from detail pages. */
export function isTabRoot(pathname: string): boolean {
  return TABS.some((t) => t.href === pathname);
}

/**
 * Tab switches keep history shallow, like a native app: leaving the home tab
 * pushes, switching between other tabs replaces. Back from any tab then lands
 * on Ringkasan, and back from Ringkasan leaves the app.
 */
export function shouldReplace(from: string): boolean {
  return from !== "/";
}

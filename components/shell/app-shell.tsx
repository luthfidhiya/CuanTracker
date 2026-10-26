"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { ExitConfirm } from "./exit-confirm";
import { TABS, isTabRoot, shouldReplace, tabIndex } from "./nav";
import { PrivacyToggle } from "./privacy-toggle";
import { SettingsMenu } from "./settings-menu";

// A swipe switches tabs when it travels far enough, or is a quick flick.
const SWIPE_MIN_PX = 60;
const SWIPE_MIN_FRACTION = 0.18; // of screen width
const FLICK_MIN_PX = 40;
const FLICK_MIN_VELOCITY = 0.4; // px per ms
// How much the page follows the finger while dragging, and how far at most.
const DRAG_FOLLOW = 0.4;
const DRAG_MAX_PX = 96;

/** Swipes that start inside something scrollable sideways (charts, chips) belong to it. */
function startsInHorizontalScroller(target: EventTarget | null, boundary: HTMLElement | null) {
  for (let el = target as HTMLElement | null; el && el !== boundary; el = el.parentElement) {
    const { overflowX } = window.getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) return true;
  }
  return false;
}

/**
 * `addTransaction` is rendered by the server layout (it needs wallets and
 * categories) and placed both in the desktop sidebar and the mobile bottom bar.
 */
export function AppShell({
  addTransaction,
  spreadsheetUrl,
  children,
}: {
  addTransaction: React.ReactNode;
  spreadsheetUrl?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // Slide direction comes from where we navigated from, tracked across renders.
  const [nav, setNav] = useState({ path: pathname, direction: 0 });
  if (nav.path !== pathname) {
    const from = tabIndex(nav.path);
    const to = tabIndex(pathname);
    setNav({ path: pathname, direction: from === -1 || to === -1 || from === to ? 0 : Math.sign(to - from) });
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; t: number; horizontal: boolean } | null>(null);

  /** Moves the page with the finger; `null` springs it back. */
  const setDrag = (dx: number | null) => {
    const el = dragRef.current;
    if (!el) return;
    if (dx === null) {
      el.style.transition = "transform 200ms ease-out";
      el.style.transform = "";
    } else {
      el.style.transition = "none";
      el.style.transform = `translateX(${dx}px)`;
    }
  };

  const go = (href: string) => {
    if (shouldReplace(pathname)) router.replace(href);
    else router.push(href);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (
      e.touches.length !== 1 ||
      !isTabRoot(pathname) ||
      // React bubbles events out of portals: ignore touches inside open sheets and dialogs.
      !rootRef.current?.contains(e.target as Node) ||
      startsInHorizontalScroller(e.target, rootRef.current)
    ) {
      touch.current = null;
      return;
    }
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp, horizontal: false };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = touch.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;
    if (!t.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        touch.current = null; // vertical scroll wins
        return;
      }
      if (Math.abs(dx) < 10) return;
      t.horizontal = true;
    }
    // No neighbour in that direction: resist more, so the edge is felt.
    const next = tabIndex(pathname) + (dx < 0 ? 1 : -1);
    const follow = next >= 0 && next < TABS.length ? DRAG_FOLLOW : DRAG_FOLLOW / 3;
    setDrag(Math.max(-DRAG_MAX_PX, Math.min(DRAG_MAX_PX, dx * follow)));
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t?.horizontal) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const velocity = Math.abs(dx) / Math.max(1, e.timeStamp - t.t);
    const far = Math.abs(dx) >= Math.max(SWIPE_MIN_PX, window.innerWidth * SWIPE_MIN_FRACTION);
    const flick = Math.abs(dx) >= FLICK_MIN_PX && velocity >= FLICK_MIN_VELOCITY;
    const next = tabIndex(pathname) + (dx < 0 ? 1 : -1);
    setDrag(null);
    if ((far || flick) && next >= 0 && next < TABS.length) go(TABS[next].href);
  };

  const active = tabIndex(pathname);
  const offset = reduceMotion ? 0 : nav.direction * 32;

  return (
    // The whole screen is the swipe surface, not just the content, so short
    // pages can be swiped anywhere. pan-y keeps vertical scrolling native.
    <div
      ref={rootRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touch.current = null;
        setDrag(null);
      }}
      className="min-h-dvh touch-pan-y lg:flex"
    >
      <ExitConfirm />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 px-3" aria-label="CuanTracker, ke Ringkasan">
          <Logo className="h-7" />
        </Link>
        <div className="mb-4 px-1">{addTransaction}</div>
        <nav aria-label="Navigasi utama" className="flex flex-col gap-0.5">
          {TABS.map((tab, i) => (
            <Link
              key={tab.href}
              href={tab.href}
              replace={shouldReplace(pathname)}
              aria-current={i === active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                i === active ? "bg-surface-2 font-medium text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <tab.icon className="size-[18px]" />
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-0.5">
          <PrivacyToggle withLabel />
          <SettingsMenu variant="row" spreadsheetUrl={spreadsheetUrl} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur lg:hidden">
          <Link href="/" aria-label="CuanTracker, ke Ringkasan">
            <Logo preload />
          </Link>
          <div className="flex items-center">
            <PrivacyToggle />
            <SettingsMenu variant="icon" spreadsheetUrl={spreadsheetUrl} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl overflow-x-clip px-4 pb-28 pt-5 lg:px-10 lg:pb-12 lg:pt-10">
          <div ref={dragRef}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: offset }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {TABS.slice(0, 2).map((tab, i) => (
            <BottomTab key={tab.href} tab={tab} active={i === active} replace={shouldReplace(pathname)} />
          ))}
          <div className="grid place-items-center">{addTransaction}</div>
          {TABS.slice(2).map((tab, i) => (
            <BottomTab key={tab.href} tab={tab} active={i + 2 === active} replace={shouldReplace(pathname)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function BottomTab({
  tab,
  active,
  replace,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  replace: boolean;
}) {
  return (
    <Link
      href={tab.href}
      replace={replace}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
        active ? "text-fg" : "text-subtle hover:text-muted"
      )}
    >
      <tab.icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
      {tab.label}
    </Link>
  );
}

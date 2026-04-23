"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ChartLine,
  Tags,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dashboard } from "./Dashboard";
import { WalletList } from "./WalletList";
import { TransactionList } from "./TransactionList";
import { Monitoring } from "./Monitoring";
import { CategoryList } from "./CategoryList";
import { usePrivacy } from "./PrivacyContext";

const TAB_ORDER = [
  "dashboard",
  "transactions",
  "wallets",
  "categories",
  "monitoring",
];
const SWIPE_THRESHOLD = 0.3; // 30% of screen width

// ─── Media Query Hook (SSR-safe, no hydration mismatch) ─────────────────────
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeMediaQuery(cb: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getIsDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerSnapshot() {
  return true; // SSR default: assume desktop (hidden via CSS anyway)
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState("wallets");
  const [focusWalletId, setFocusWalletId] = useState<string | null>(null);
  const { isHidden, toggleHidden } = usePrivacy();
  const isDesktop = useSyncExternalStore(
    subscribeMediaQuery,
    getIsDesktop,
    getServerSnapshot
  );

  const activeIndex = TAB_ORDER.indexOf(activeTab);

  // ─── Mobile Swipe State ──────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalLocked = useRef(false);

  // Helper: render tab content by id
  const getTabContent = (tabId: string) => {
    if (tabId !== activeTab) return null;

    switch (tabId) {
      case "dashboard":
        return (
          <Dashboard
            onNavigateTab={setActiveTab}
            onWalletClick={(walletId) => {
              setFocusWalletId(walletId);
              setActiveTab("wallets");
            }}
          />
        );
      case "transactions":
        return <TransactionList />;
      case "wallets":
        return (
          <WalletList
            focusWalletId={focusWalletId}
            onClearFocus={() => setFocusWalletId(null)}
          />
        );
      case "categories":
        return <CategoryList />;
      case "monitoring":
        return <Monitoring />;
      default:
        return null;
    }
  };

  // ─── Check if touch started inside a horizontally scrollable element ──
  const isInsideScrollable = useCallback((target: EventTarget) => {
    let el = target as HTMLElement | null;
    while (el && el !== containerRef.current) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === "auto" || style.overflowX === "scroll") {
        if (el.scrollWidth > el.clientWidth) return true;
      }
      el = el.parentElement;
    }
    return false;
  }, []);

  // ─── Touch Handlers ──────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isInsideScrollable(e.target)) {
        isDragging.current = false;
        return;
      }
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      isHorizontalLocked.current = false;

      if (trackRef.current) {
        trackRef.current.style.transition = "none";
      }
    },
    [isInsideScrollable]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;

      // Determine scroll direction if not yet locked
      if (!isHorizontalLocked.current) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
          // Vertical scroll dominates — abort swipe
          isDragging.current = false;
          return;
        }
        if (Math.abs(deltaX) > 10) {
          isHorizontalLocked.current = true;
        }
      }

      if (!isHorizontalLocked.current) return;

      const screenWidth = window.innerWidth;
      const baseOffset = -activeIndex * screenWidth;

      // Rubber-band at edges
      let adjustedDelta = deltaX;
      if (
        (activeIndex === 0 && deltaX > 0) ||
        (activeIndex === TAB_ORDER.length - 1 && deltaX < 0)
      ) {
        adjustedDelta = deltaX * 0.25;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${
          baseOffset + adjustedDelta
        }px)`;
      }
    },
    [activeIndex]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || !isHorizontalLocked.current) {
        isDragging.current = false;
        return;
      }

      isDragging.current = false;
      isHorizontalLocked.current = false;

      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - touchStartX.current;
      const screenWidth = window.innerWidth;
      const threshold = screenWidth * SWIPE_THRESHOLD;

      let newIndex = activeIndex;
      if (deltaX < -threshold && activeIndex < TAB_ORDER.length - 1) {
        newIndex = activeIndex + 1; // Swipe left → next
      } else if (deltaX > threshold && activeIndex > 0) {
        newIndex = activeIndex - 1; // Swipe right → prev
      }

      // Animate to final position (commit or snap-back)
      if (trackRef.current) {
        trackRef.current.style.transition =
          "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        trackRef.current.style.transform = `translateX(${
          -newIndex * screenWidth
        }px)`;
      }

      if (newIndex !== activeIndex) {
        setActiveTab(TAB_ORDER[newIndex]);
      }
    },
    [activeIndex]
  );

  // ─── Sync mobile carousel position on tab change (button clicks) ─────
  useEffect(() => {
    if (trackRef.current) {
      const screenWidth = window.innerWidth;
      trackRef.current.style.transition =
        "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      trackRef.current.style.transform = `translateX(${
        -activeIndex * screenWidth
      }px)`;
    }
  }, [activeIndex]);

  // ─── Handle window resize ────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (trackRef.current) {
        const screenWidth = window.innerWidth;
        trackRef.current.style.transition = "none";
        trackRef.current.style.transform = `translateX(${
          -activeIndex * screenWidth
        }px)`;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  // ─── Auto-scroll Mobile Active Tab ─────────────────────────────────────
  useEffect(() => {
    if (!isDesktop) {
      const activeEl = document.getElementById(`mobile-tab-${activeTab}`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab, isDesktop]);

  return (
    <div className="min-h-screen bg-aurora text-slate-50 selection:bg-blue-500/30 overflow-hidden flex">
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex w-full"
      >
        {/* ═══ DESKTOP SIDEBAR (Visible ≥ lg) ═══ */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-2xl p-6 shadow-2xl z-40 relative">
          <div className="mb-12">
            <h1 className="text-3xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter">
              Cuan
              <span className="text-white not-italic font-bold">Tracker</span>
            </h1>
            <div className="flex items-center justify-between mt-1">
              <p className="text-blue-400/50 text-xs font-bold capitalize tracking-[0.3em]">
                Personal Wealth
              </p>
              <button
                onClick={toggleHidden}
                className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                aria-label="Toggle Privacy Mode"
              >
                {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Tabs.List className="flex flex-col gap-2 flex-1 outline-none">
            <SidebarItem
              value="dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Overview"
            />
            <SidebarItem
              value="transactions"
              icon={<ArrowRightLeft size={20} />}
              label="Transactions"
            />
            <SidebarItem
              value="wallets"
              icon={<Wallet size={20} />}
              label="Wallets & Cards"
            />
            <SidebarItem
              value="categories"
              icon={<Tags size={20} />}
              label="Categories"
            />
            <SidebarItem
              value="monitoring"
              icon={<ChartLine size={20} />}
              label="Analytics"
            />
          </Tabs.List>
        </aside>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <div className="flex-1 flex flex-col relative max-w-7xl mx-auto w-full h-screen overflow-hidden">
          {/* ─── MOBILE HEADER & TABS (Visible < lg) ─── */}
          <header className="lg:hidden z-30 bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 pt-6 pb-2 sticky top-0 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
            <div className="px-6 mb-4 flex justify-between items-center">
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter">
                Cuan
                <span className="text-white not-italic font-bold">Tracker</span>
              </h1>
              <button
                onClick={toggleHidden}
                className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                aria-label="Toggle Privacy Mode"
              >
                {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Horizontal Scrollable Tabs */}
            <Tabs.List className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2 w-full outline-none snap-x">
              <TopTabItem
                value="dashboard"
                icon={<LayoutDashboard size={16} />}
                label="Overview"
              />
              <TopTabItem
                value="transactions"
                icon={<ArrowRightLeft size={16} />}
                label="Activity"
              />
              <TopTabItem
                value="wallets"
                icon={<Wallet size={16} />}
                label="Wallets"
              />
              <TopTabItem
                value="categories"
                icon={<Tags size={16} />}
                label="Tags"
              />
              <TopTabItem
                value="monitoring"
                icon={<ChartLine size={16} />}
                label="Analytics"
              />
            </Tabs.List>
          </header>

          {/* ═══ DESKTOP CONTENT: AnimatePresence Fade + Zoom (≥ lg) ═══ */}
          {isDesktop && (
            <main className="hidden lg:block flex-1 overflow-y-auto pb-8 px-8 pt-8 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full"
                >
                  {getTabContent(activeTab)}
                </motion.div>
              </AnimatePresence>
            </main>
          )}

          {/* ═══ MOBILE CONTENT: Swipeable Carousel (< lg) ═══ */}
          {!isDesktop && (
            <div
              ref={containerRef}
              className="lg:hidden flex-1 overflow-hidden relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={trackRef}
                className="flex h-full will-change-transform"
                style={{ width: `${TAB_ORDER.length * 100}vw` }}
              >
                {TAB_ORDER.map((tabId) => (
                  <div
                    key={tabId}
                    className="h-full overflow-y-auto overflow-x-hidden pb-32 px-4 pt-4 no-scrollbar"
                    style={{ width: "100vw" }}
                  >
                    {getTabContent(tabId)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Tabs.Root>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function SidebarItem({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "flex outline-none items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group text-left cursor-pointer",
        "data-[state=active]:bg-blue-600/10 data-[state=active]:text-blue-400",
        "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      )}
    >
      <div className="relative z-10">{icon}</div>
      <span className="font-semibold text-sm tracking-wide relative z-10">
        {label}
      </span>
      {/* Active Indicator Line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-500 rounded-r-full group-data-[state=active]:h-1/2 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
    </Tabs.Trigger>
  );
}

function TopTabItem({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Tabs.Trigger
      id={`mobile-tab-${value}`}
      value={value}
      className={cn(
        "flex outline-none items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 relative group shrink-0 snap-start border text-sm cursor-pointer",
        // Active State: Glowing 3D Pill
        "data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:border-transparent data-[state=active]:text-white",
        // Inactive State: Glass Glassmorphic Pill
        "bg-white/5 border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/10"
      )}
    >
      <div className="relative z-10">{icon}</div>
      <span className="font-bold tracking-wide relative z-10">{label}</span>
      {/* Active Indicator Glow */}
      <div className="absolute -inset-0.5 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 blur-md bg-linear-to-r from-blue-600/40 to-cyan-500/40 pointer-events-none -z-10" />
    </Tabs.Trigger>
  );
}

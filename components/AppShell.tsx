"use client";

import React, { useState, useTransition } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ChartLine,
  Tags,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/lib/types";
import { Dashboard } from "./Dashboard";
import { WalletList } from "./WalletList";
import { TransactionList } from "./TransactionList";
import { Monitoring } from "./Monitoring";
import { CategoryList } from "./CategoryList";
import { TransactionForm } from "./TransactionForm";

interface AppShellProps {
  initialData: DashboardStats;
}

export function AppShell({ initialData }: AppShellProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-aurora text-slate-50 selection:bg-blue-500/30 overflow-hidden flex">
      <Tabs.Root 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex w-full"
      >
        {/* DESKTOP SIDEBAR (Visible > lg) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-2xl p-6 shadow-2xl z-40 relative">
          <div className="mb-12">
            <h1 className="text-3xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter">
              Cuan
              <span className="text-white not-italic font-bold">Tracker</span>
            </h1>
            <p className="text-blue-400/50 text-xs font-bold capitalize tracking-[0.3em] mt-0">
              Personal Wealth
            </p>
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

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col relative max-w-7xl mx-auto w-full h-screen overflow-hidden">
          {/* MOBILE HEADER & TABS (Visible < lg) */}
          <header className="lg:hidden z-30 bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 pt-6 pb-2 sticky top-0 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
            <div className="px-6 mb-4">
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter">
                Cuan<span className="text-white not-italic font-bold">Tracker</span>
              </h1>
            </div>
            
            {/* Horizontal Scrollable Tabs */}
            <Tabs.List className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2 w-full outline-none snap-x">
              <TopTabItem value="dashboard" icon={<LayoutDashboard size={16} />} label="Overview" />
              <TopTabItem value="transactions" icon={<ArrowRightLeft size={16} />} label="Activity" />
              <TopTabItem value="wallets" icon={<Wallet size={16} />} label="Wallets" />
              <TopTabItem value="categories" icon={<Tags size={16} />} label="Tags" />
              <TopTabItem value="monitoring" icon={<ChartLine size={16} />} label="Analytics" />
            </Tabs.List>
          </header>

          <main className="flex-1 overflow-y-auto pb-6 lg:pb-8 px-4 lg:px-8 pt-4 lg:pt-8 w-full">
            <Tabs.Content
              value="dashboard"
              className="outline-none h-full animate-in fade-in zoom-in-95 duration-500"
            >
              <Dashboard data={initialData} />
            </Tabs.Content>
            <Tabs.Content
              value="transactions"
              className="outline-none h-full animate-in fade-in zoom-in-95 duration-500"
            >
              <TransactionList
                transactions={initialData.recentTransactions}
                wallets={initialData.wallets}
                categories={initialData.categories}
              />
            </Tabs.Content>
            <Tabs.Content
              value="wallets"
              className="outline-none h-full animate-in fade-in zoom-in-95 duration-500"
            >
              <WalletList
                wallets={initialData.wallets}
                categories={initialData.categories}
              />
            </Tabs.Content>
            <Tabs.Content
              value="monitoring"
              className="outline-none h-full animate-in fade-in zoom-in-95 duration-500"
            >
              <Monitoring />
            </Tabs.Content>
            <Tabs.Content
              value="categories"
              className="outline-none h-full animate-in fade-in zoom-in-95 duration-500"
            >
              <CategoryList categories={initialData.categories} />
            </Tabs.Content>
          </main>

          {/* MOBILE FAB QUICK ADD (Visible < lg) */}
          {/* Only shown on dashboard and transactions to make sense contextually, 
              or optionally everywhere. We'll show everywhere for true quick action power. */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
              <Dialog.Trigger asChild>
                <button 
                  className="h-14 w-14 rounded-full bg-linear-to-tr from-blue-600 to-cyan-500 text-white shadow-[0_10px_25px_rgba(6,182,212,0.5)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  aria-label="Add Transaction"
                >
                  <Plus size={28} className="stroke-[2.5px]" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-50 animate-in zoom-in-95 duration-300 overflow-y-auto focus:outline-none">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                        Quick Add
                      </Dialog.Title>
                      <p className="text-blue-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                        New Transaction
                      </p>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={20} />
                      </button>
                    </Dialog.Close>
                  </div>

                  {(loading || isPending) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-[32px]">
                      <Loader2 className="animate-spin mb-3 text-blue-400/50" size={36} />
                      <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">
                        Syncing Ledger...
                      </p>
                    </div>
                  )}

                  <TransactionForm
                    wallets={initialData.wallets}
                    categories={initialData.categories}
                    onStartSubmit={() => {
                      setLoading(true);
                      // Don't close immediately here because we show the inner overlay
                    }}
                    onSuccess={() => {
                      startTransition(() => {
                        router.refresh();
                        setTimeout(() => {
                          setLoading(false);
                          setAddOpen(false);
                          setActiveTab("transactions"); // Switch to transactions tab to see it
                        }, 500); // Give router refresh a brief moment
                      });
                    }}
                  />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </Tabs.Root>
    </div>
  );
}

// Subcomponents

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
        "flex outline-none items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group text-left",
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
      value={value}
      className={cn(
        "flex outline-none items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 relative group shrink-0 snap-start border text-sm",
        // Active State: Glowing 3D Pill
        "data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:border-transparent data-[state=active]:text-white",
        // Inactive State: Glass Glassmorphic Pill
        "bg-white/5 border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/10"
      )}
    >
      <div className="relative z-10">{icon}</div>
      <span className="font-bold tracking-wide relative z-10">
        {label}
      </span>
      {/* Active Indicator Glow */}
      <div className="absolute -inset-0.5 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 blur-md bg-linear-to-r from-blue-600/40 to-cyan-500/40 pointer-events-none -z-10" />
    </Tabs.Trigger>
  );
}

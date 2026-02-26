"use client";

import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ChartLine,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/lib/types";
import { Dashboard } from "./Dashboard";
import { WalletList } from "./WalletList";
import { TransactionList } from "./TransactionList";
import { Monitoring } from "./Monitoring";
import { CategoryList } from "./CategoryList";

interface AppShellProps {
  initialData: DashboardStats;
}

export function AppShell({ initialData }: AppShellProps) {
  return (
    <div className="min-h-screen bg-aurora text-slate-50 selection:bg-blue-500/30 overflow-hidden flex">
      <Tabs.Root defaultValue="dashboard" className="flex-1 flex w-full">
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

          <Tabs.List className="flex flex-col gap-2 flex-1">
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
          {/* MOBILE HEADER (Visible < lg) */}
          <header className="lg:hidden p-6 pb-2 flex justify-between items-center z-30 relative">
            <div>
              <h1 className="text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter">
                Cuan
                <span className="text-white not-italic font-bold">Tracker</span>
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-8 px-4 lg:px-8 pt-4 lg:pt-8 w-full">
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

          {/* MOBILE FLOATING FAB & NAV (Visible < lg) */}
          <div className="lg:hidden fixed bottom-6 left-0 right-0 px-4 flex justify-between items-end z-40 pointer-events-none">
            {/* Nav Pill */}
            <nav className="pointer-events-auto flex-1 w-full flex justify-center pb-2 opacity-95">
              <Tabs.List className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl flex justify-between items-center p-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                <BottomNavItem
                  value="dashboard"
                  icon={<LayoutDashboard size={22} />}
                />
                <BottomNavItem
                  value="transactions"
                  icon={<ArrowRightLeft size={22} />}
                />
                <BottomNavItem value="wallets" icon={<Wallet size={22} />} />
                <BottomNavItem value="categories" icon={<Tags size={22} />} />
                <BottomNavItem
                  value="monitoring"
                  icon={<ChartLine size={22} />}
                />
              </Tabs.List>
            </nav>
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

function BottomNavItem({
  value,
  icon,
}: {
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "flex outline-none flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 flex-1 relative group",
        "data-[state=active]:text-white data-[state=active]:bg-white/10",
        "text-white/30 hover:text-white/60"
      )}
    >
      {icon}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-data-[state=active]:opacity-100 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
    </Tabs.Trigger>
  );
}

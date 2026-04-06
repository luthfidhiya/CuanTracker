"use client";

import React from "react";
import { DashboardStats } from "@/lib/types";
import { GlassCard } from "./ui/glass-card";
import { TrendingUp, CreditCard, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";

export function Dashboard({ data }: { data: DashboardStats }) {
  const chartData = [
    { name: "Income", value: data.incomeThisMonth, color: "#3B82F6" }, // Blue
    { name: "Expense", value: data.expenseThisMonth, color: "#06B6D4" }, // Cyan
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full">
      {/* LEFT COLUMN: Overview Stats */}
      <div className="flex-1 space-y-6 lg:space-y-8 flex flex-col">
        {/* Glowing Total Balance Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-cyan-400 rounded-[32px] blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
          <GlassCard className="p-8 lg:p-10 border-white/5 relative bg-slate-950/80 backdrop-blur-3xl overflow-hidden">
            {/* Background Glow inside card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-2">
                <p className="text-blue-400/60 text-xs font-black capitalize tracking-[0.3em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Available Balance
                </p>
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-slate-400 tracking-tighter">
                  <span className="text-2xl font-medium text-slate-500 mr-2 italic">
                    Rp
                  </span>
                  {data.totalBalance.toLocaleString("id-ID")}
                </h2>
              </div>
              <div className="hidden sm:flex h-16 w-16 bg-blue-500/10 rounded-2xl items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <TrendingUp className="text-blue-400" size={32} />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts & Mini Wallets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <GlassCard className="p-6 flex flex-col h-full bg-slate-900/40 border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="flex flex-col mb-6 gap-4 relative z-10">
              <h3 className="text-sm font-black text-slate-400 capitalize tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-blue-400" />
                Monthly Flow
              </h3>

              <div className="flex gap-6 sm:gap-8">
                {/* Inflow Legend Item */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="text-[10px] font-bold text-blue-400 capitalize tracking-widest">
                      Inflow
                    </span>
                  </div>
                  <p className="text-lg font-black text-white tracking-tight">
                    Rp {data.incomeThisMonth.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Outflow Legend Item */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                    <span className="text-[10px] font-bold text-cyan-400 capitalize tracking-widest">
                      Outflow
                    </span>
                  </div>
                  <p className="text-lg font-black text-white tracking-tight">
                    Rp {data.expenseThisMonth.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[150px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#ffffff20"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59,130,246,0.05)" }}
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#fff" }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) =>
                      `Rp ${Number(val).toLocaleString("id-ID")}`
                    }
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col h-full bg-slate-900/40 border-white/5">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h3 className="text-sm font-black text-slate-400 capitalize tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-cyan-400" />
                Quick Wallets
              </h3>
            </div>
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:flex-1 pb-2 lg:pb-0 no-scrollbar snap-x">
              {data.wallets.length === 0 ? (
                <div className="text-slate-500 text-xs text-center mt-10 italic">
                  No wallets found
                </div>
              ) : (
                data.wallets.slice(0, 4).map((wallet) => (
                  <div
                    key={wallet.id}
                    className="p-4 w-[200px] shrink-0 snap-start lg:w-auto rounded-2xl bg-slate-800/50 border border-white/5 flex flex-col gap-1 transition-all hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{
                          backgroundColor: wallet.color,
                          color: wallet.color,
                        }}
                      ></div>
                      <span className="text-xs font-bold text-slate-300">
                        {wallet.name}
                      </span>
                    </div>
                    <span className="text-lg font-black text-white pl-5 tracking-tight">
                      <span className="text-xs text-slate-500 mr-1 font-medium">
                        Rp
                      </span>
                      {wallet.currentBalance.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* RIGHT COLUMN: Recent Activity */}
      <div className="lg:w-[350px] xl:w-[400px] flex flex-col gap-4">
        <h3 className="text-sm font-black text-slate-400 capitalize tracking-widest mb-0 lg:mb-2 px-2 mt-4 lg:mt-0">
          Recent Activity
        </h3>
        <div className="flex-1 space-y-3 lg:overflow-y-auto no-scrollbar">
          {data.recentTransactions.length === 0 ? (
            <GlassCard className="p-8 text-center text-slate-500 text-sm border-white/5 bg-slate-900/40">
              No recent activity.
            </GlassCard>
          ) : (
            data.recentTransactions.slice(0, 8).map((t) => (
              <GlassCard
                key={t.id}
                className="p-4 flex justify-between items-center group hover:bg-slate-800/80 transition-colors border-white/5 bg-slate-900/40"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg
                    ${
                      t.type === "INCOME"
                        ? "bg-blue-500/10 text-blue-400"
                        : t.type === "EXPENSE"
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {t.category
                      ? t.category.charAt(0).toUpperCase()
                      : t.type === "TRANSFER"
                      ? "T"
                      : "$"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {t.category || t.description || "Transfer"}
                    </p>
                    <p className="text-xs text-slate-400 capitalize tracking-widest font-semibold mt-0.5">
                      {new Date(t.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-sm font-black tracking-tight ${
                    t.type === "INCOME"
                      ? "text-blue-400"
                      : t.type === "EXPENSE"
                      ? "text-white"
                      : "text-slate-400"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "-" : ""}
                  {t.amount.toLocaleString("id-ID")}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

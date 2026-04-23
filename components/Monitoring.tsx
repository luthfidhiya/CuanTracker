"use client";

import React, { useState, useEffect, useRef } from "react";
import { DetailedStats, StatItem } from "@/lib/types";
import { getMonitoringData } from "@/app/actions";
import { GlassCard } from "./ui/glass-card";
import { usePrivacy, maskAmount } from "./PrivacyContext";
import { useRefresh } from "./RefreshContext";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { Loader2, Activity } from "lucide-react";

export function Monitoring() {
  const { isHidden } = usePrivacy();
  const { refreshKey } = useRefresh();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailedStats | null>(null);
  const [range, setRange] = useState({
    start: format(new Date(), "yyyy-MM-01"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const lastFetchedKey = useRef(refreshKey);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch data when range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getMonitoringData(range.start, range.end);
        setData(result);
        lastFetchedKey.current = refreshKey;
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  // Lazy refetch: only when this component becomes visible AND data is stale
  useEffect(() => {
    if (refreshKey <= lastFetchedKey.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && refreshKey > lastFetchedKey.current) {
          lastFetchedKey.current = refreshKey;
          const fetchData = async () => {
            setLoading(true);
            try {
              const result = await getMonitoringData(range.start, range.end);
              setData(result);
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
            }
          };
          fetchData();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [refreshKey, range.start, range.end]);

  const COLORS = [
    "#3b82f6", // Blue
    "#06b6d4", // Cyan
    "#14b8a6", // Teal
    "#8b5cf6", // Violet
    "#6366f1", // Indigo
    "#ec4899", // Pink
    "#f43f5e", // Rose
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <p className="text-white font-bold text-sm tracking-tight mb-1">
            {payload[0].name}
          </p>
          <p className="text-cyan-400 font-black tracking-widest text-lg drop-shadow-sm">
            <span className="text-xs text-slate-500 mr-1 opacity-80 capitalize">
              Rp
            </span>
            {maskAmount(payload[0].value, isHidden, "")}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (
    title: string,
    dataItems: StatItem[],
    emptyMsg: string,
    isDonut = false
  ) => (
    <GlassCard className="p-6 flex flex-col min-h-[300px] lg:min-h-[350px] border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
      <h3 className="text-sm font-black text-slate-400 capitalize tracking-widest mb-6 flex items-center gap-2">
        <Activity size={14} className="text-blue-500" />
        {title}
      </h3>
      <div className={cn("flex-1 min-h-[220px] relative transition-all duration-500", isHidden ? "blur-md opacity-30 pointer-events-none" : "")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={dataItems as any}
              innerRadius={isDonut ? 65 : 0}
              outerRadius={90}
              dataKey="value"
              stroke="#020617"
              strokeWidth={2}
              cornerRadius={isDonut ? 6 : 0}
            >
              {dataItems.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.8}
                  style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.3))" }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "transparent" }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "#94a3b8",
                paddingLeft: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {dataItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs capitalize font-bold tracking-widest">
            {emptyMsg}
          </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <div ref={containerRef} className="space-y-6 pb-20 lg:pb-0 lg:bg-slate-950/50 lg:backdrop-blur-xl lg:p-8 lg:rounded-[32px] lg:border lg:border-white/5 lg:shadow-2xl min-h-[500px]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter capitalize">
            Analytics Hub
          </h2>
          <p className="text-xs text-blue-400/50 font-bold capitalize tracking-[0.2em] mt-0">
            Financial Insights & Telemetry
          </p>
        </div>
        <div className="flex gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/5 shadow-inner w-full lg:w-auto overflow-x-auto no-scrollbar">
          <input
            type="date"
            value={range.start}
            onChange={(e) => setRange({ ...range, start: e.target.value })}
            className="bg-slate-800/80 rounded-lg text-xs text-white px-3 py-2 flex-1 lg:flex-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-bold capitalize tracking-wider cursor-pointer transition-all"
          />
          <span className="text-slate-500 self-center font-bold text-xs capitalize px-1">
            to
          </span>
          <input
            type="date"
            value={range.end}
            onChange={(e) => setRange({ ...range, end: e.target.value })}
            className="bg-slate-800/80 rounded-lg text-xs text-white px-3 py-2 flex-1 lg:flex-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-bold capitalize tracking-wider cursor-pointer transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-blue-400/30">
          <Loader2
            className="animate-spin text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-full"
            size={48}
          />
          <p className="text-xs font-bold capitalize tracking-[0.2em]">
            Crunching Telemetry...
          </p>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Top Section: Integrated Trend Chart & Ratio */}
          <GlassCard className="flex flex-col p-6 border-white/5 bg-slate-900/40 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8 relative z-10">
              <div>
                <h3 className="text-sm font-black text-slate-400 capitalize tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" />
                  Cash Flow Temporal Trend & Ratio
                </h3>

                <div className="flex flex-wrap gap-6 sm:gap-10">
                  {/* Inflow Stat */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                      <span className="text-xs font-bold text-blue-400 capitalize tracking-widest">
                        Inflow (
                        {data.totalIncome > 0
                          ? (
                              (data.totalIncome /
                                (data.totalIncome + data.totalExpense)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {maskAmount(data.totalIncome, isHidden)}
                    </p>
                  </div>

                  {/* Outflow Stat */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                      <span className="text-xs font-bold text-cyan-400 capitalize tracking-widest">
                        Outflow (
                        {data.totalExpense > 0
                          ? (
                              (data.totalExpense /
                                (data.totalIncome + data.totalExpense)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {maskAmount(data.totalExpense, isHidden)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Volume Ratio Bar */}
              <div className="w-full xl:w-64 space-y-2 shrink-0">
                <div className="flex justify-between text-[10px] font-bold capitalize tracking-widest text-slate-500">
                  <span>Volume Ratio</span>
                  <span>
                    {data.totalIncome + data.totalExpense > 0 ? "100%" : "0%"}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    style={{
                      width: `${
                        data.totalIncome > 0
                          ? (data.totalIncome /
                              (data.totalIncome + data.totalExpense)) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                  <div
                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                    style={{
                      width: `${
                        data.totalExpense > 0
                          ? (data.totalExpense /
                              (data.totalIncome + data.totalExpense)) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={cn("w-full h-[300px] lg:h-[400px] relative z-10 transition-all duration-500", isHidden ? "blur-md opacity-30 pointer-events-none" : "")}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorIncome"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorExpense"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="#ffffff20"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                    interval={"preserveStartEnd"}
                  />
                  <YAxis
                    stroke="#ffffff20"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000000) {
                        return `Rp ${(val / 1000000000)
                          .toFixed(1)
                          .replace(/\\.0$/, "")}M`;
                      }
                      if (val >= 1000000) {
                        return `Rp ${(val / 1000000)
                          .toFixed(1)
                          .replace(/\\.0$/, "")}Jt`;
                      }
                      if (val >= 1000) {
                        return `Rp ${(val / 1000).toFixed(0)}Rb`;
                      }
                      return `Rp ${val}`;
                    }}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "rgba(255,255,255,0.1)",
                      strokeWidth: 2,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "16px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) =>
                      `Rp ${Number(val).toLocaleString("id-ID", { maximumFractionDigits: 10 })}`
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    strokeWidth={3}
                    activeDot={{
                      r: 6,
                      fill: "#3b82f6",
                      stroke: "#0f172a",
                      strokeWidth: 3,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    strokeWidth={3}
                    activeDot={{
                      r: 6,
                      fill: "#06b6d4",
                      stroke: "#0f172a",
                      strokeWidth: 3,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Desktop 3-Column Grid Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {renderPieChart(
              "Expense Nodes",
              data.expenseByCategory,
              "No logs recorded",
              false
            )}
            {renderPieChart(
              "Outflow by Account",
              data.expenseByWallet,
              "No logs recorded",
              true
            )}
            {renderPieChart(
              "Inflow by Account",
              data.incomeByWallet,
              "No logs recorded",
              true
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 py-20 font-bold capitalize tracking-widest text-sm">
          No telemetry found
        </div>
      )}
    </div>
  );
}

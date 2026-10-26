"use client";

import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PrivacyBlur } from "@/components/ui/amount";
import { formatMonthShort, formatShortDate } from "@/lib/format-date";
import { formatIdrCompact, formatMoney } from "@/lib/money";
import type { Trend } from "@/lib/types";

const INCOME = "var(--color-income)";
const EXPENSE = "var(--color-expense)";
const AXIS_TICK = { fill: "var(--color-muted)", fontSize: 12 };

/** Daily ranges are spiky (payday, one big purchase), so they read better as bars than as a line. */
export function TrendChart({ trend }: { trend: Trend }) {
  const daily = trend.granularity === "day";
  const tickLabel = (key: string) => (daily ? String(Number(key.slice(8))) : formatMonthShort(key));
  const fullLabel = (key: string) => (daily ? formatShortDate(key) : formatMonthShort(key));

  return (
    <PrivacyBlur className="h-64">
      {/* The server can't measure the container; a starting size keeps the SSR pass from warning. */}
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 256 }}>
        <ComposedChart data={trend.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={1}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="key"
            tickFormatter={tickLabel}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={daily ? 8 : 16}
          />
          <YAxis tickFormatter={formatIdrCompact} tick={AXIS_TICK} axisLine={false} tickLine={false} width={72} />
          <Tooltip
            cursor={daily ? { fill: "var(--color-surface-2)" } : { stroke: "var(--color-border-strong)" }}
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--color-fg)", marginBottom: 4 }}
            labelFormatter={(label) => fullLabel(String(label))}
            formatter={(value, name) => [
              formatMoney(Number(value), "IDR"),
              name === "income" ? "Pemasukan" : "Pengeluaran",
            ]}
          />
          {daily ? (
            <>
              <Bar dataKey="income" fill={INCOME} radius={[3, 3, 0, 0]} maxBarSize={10} />
              <Bar dataKey="expense" fill={EXPENSE} radius={[3, 3, 0, 0]} maxBarSize={10} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="income" stroke={INCOME} fill={INCOME} fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke={EXPENSE} fill={EXPENSE} fillOpacity={0.12} strokeWidth={2} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </PrivacyBlur>
  );
}

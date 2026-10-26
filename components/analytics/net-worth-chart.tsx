"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PrivacyBlur } from "@/components/ui/amount";
import { formatMonthShort } from "@/lib/format-date";
import { formatIdrCompact, formatMoney } from "@/lib/money";

const COLOR = "var(--color-accent)";
const AXIS_TICK = { fill: "var(--color-muted)", fontSize: 12 };

export function NetWorthChart({ points }: { points: { month: string; value: number }[] }) {
  return (
    <PrivacyBlur className="h-56">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 224 }}>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthShort}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tickFormatter={formatIdrCompact}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={72}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)" }}
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--color-fg)", marginBottom: 4 }}
            labelFormatter={(label) => `Akhir ${formatMonthShort(String(label))}`}
            formatter={(value) => [formatMoney(Math.round(Number(value)), "IDR"), "Total saldo"]}
          />
          <Area type="monotone" dataKey="value" stroke={COLOR} fill={COLOR} fillOpacity={0.12} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </PrivacyBlur>
  );
}

import Link from "next/link";
import { connection } from "next/server";
import { Breakdown } from "@/components/analytics/breakdown";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, PageHeader } from "@/components/ui/misc";
import { RatesNotice } from "@/components/ui/rates-notice";
import { Stat } from "@/components/ui/stat";
import { buildDetailedStats } from "@/lib/analytics";
import { listCategories } from "@/lib/data/categories";
import { getRates } from "@/lib/data/rates";
import { listTransactionsBetween } from "@/lib/data/transactions";
import { listWallets } from "@/lib/data/wallets";
import { formatDate } from "@/lib/format-date";
import { dateParam, type SearchParams } from "@/lib/params";
import { firstDayOfMonth, monthKeyFromDate, shiftMonth, todayIso } from "@/lib/sheets/schema";
import { cn } from "@/lib/utils";

/** Each month is a separate sheet read, so very long ranges are clamped. */
const MAX_MONTHS = 24;

function presets(today: string) {
  const month = monthKeyFromDate(today);
  return [
    { label: "Bulan ini", from: firstDayOfMonth(month) },
    { label: "3 bulan", from: firstDayOfMonth(shiftMonth(month, -2)) },
    { label: "6 bulan", from: firstDayOfMonth(shiftMonth(month, -5)) },
    { label: "Tahun ini", from: `${month.slice(0, 4)}-01-01` },
  ].map((p) => ({ ...p, to: today }));
}

function resolveRange(fromParam: string | undefined, toParam: string | undefined, today: string) {
  let to = toParam ?? today;
  let from = fromParam ?? firstDayOfMonth(monthKeyFromDate(today));
  if (from > to) [from, to] = [to, from];
  const earliest = firstDayOfMonth(shiftMonth(monthKeyFromDate(to), -(MAX_MONTHS - 1)));
  return { from: from < earliest ? earliest : from, to, clamped: from < earliest };
}

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const query = await searchParams;
  const today = todayIso();
  const { from, to, clamped } = resolveRange(dateParam(query.from), dateParam(query.to), today);

  const [transactions, wallets, categories, rates] = await Promise.all([
    listTransactionsBetween(from, to),
    listWallets(),
    listCategories(),
    getRates(),
  ]);
  const stats = buildDetailedStats(transactions, wallets, categories, rates, { from, to });
  const net = stats.totalIncome - stats.totalExpense;
  const savingRate = stats.totalIncome > 0 ? (net / stats.totalIncome) * 100 : null;

  return (
    <>
      <PageHeader
        title="Analitik"
        description={`${formatDate(from)} – ${formatDate(to)}${clamped ? ` (maks. ${MAX_MONTHS} bulan)` : ""}`}
      />

      <div className="mb-6 space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {presets(today).map((p) => {
            const active = p.from === from && p.to === to;
            return (
              <Link
                key={p.label}
                href={`/analytics?from=${p.from}&to=${p.to}`}
                replace
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3 text-sm leading-[30px] transition-colors",
                  active ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-border-strong hover:text-fg"
                )}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
        <form action="/analytics" className="flex flex-wrap items-end gap-2">
          <label className="text-sm text-muted">
            <span className="mb-1 block">Dari</span>
            <Input type="date" name="from" defaultValue={from} max={today} className="w-40" />
          </label>
          <label className="text-sm text-muted">
            <span className="mb-1 block">Sampai</span>
            <Input type="date" name="to" defaultValue={to} className="w-40" />
          </label>
          <Button type="submit" variant="secondary">Terapkan</Button>
        </form>
      </div>

      <div className="mb-3 empty:hidden">
        <RatesNotice rates={rates} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pemasukan" value={stats.totalIncome} tone="income" />
        <Stat label="Pengeluaran" value={stats.totalExpense} tone="expense" />
        <Stat label="Selisih" value={net} />
        <Card className="px-4 py-3">
          <p className="text-xs text-muted">Rasio tabungan</p>
          <p className="tabular mt-1 text-base font-semibold">
            {savingRate === null ? "—" : `${savingRate.toFixed(1).replace(".", ",")}%`}
          </p>
        </Card>
      </div>

      {stats.trend.points.length > 1 && (
        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-sm font-medium text-muted">
            {stats.trend.granularity === "day" ? "Tren harian" : "Tren bulanan"}
          </h2>
          <TrendChart trend={stats.trend} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Breakdown title="Pengeluaran per kategori" items={stats.expenseByCategory} empty="Belum ada pengeluaran" />
          <Breakdown title="Pemasukan per kategori" items={stats.incomeByCategory} empty="Belum ada pemasukan" />
        </div>
        <div className="space-y-4">
          <Breakdown title="Pengeluaran per dompet" items={stats.expenseByWallet} empty="Belum ada pengeluaran" />
          <Breakdown title="Pemasukan per dompet" items={stats.incomeByWallet} empty="Belum ada pemasukan" />
        </div>
      </div>
    </>
  );
}

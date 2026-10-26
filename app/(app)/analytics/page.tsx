import { connection } from "next/server";
import { TrendingUp } from "lucide-react";
import { Breakdown } from "@/components/analytics/breakdown";
import { NetWorthChart } from "@/components/analytics/net-worth-chart";
import { RangePicker } from "@/components/analytics/range-picker";
import { TrendChart } from "@/components/analytics/trend-chart";
import { analyticsView, ViewTabs, type AnalyticsView } from "@/components/analytics/view-tabs";
import { Amount } from "@/components/ui/amount";
import { Change } from "@/components/ui/change";
import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { RatesNotice } from "@/components/ui/rates-notice";
import { Stat } from "@/components/ui/stat";
import { buildDetailedStats, buildNetWorth, previousPeriod, sumIncomeExpense } from "@/lib/analytics";
import { listCategories } from "@/lib/data/categories";
import { getRates } from "@/lib/data/rates";
import { listRecentTransactions, listTransactionMonths, listTransactionsBetween } from "@/lib/data/transactions";
import { listWallets } from "@/lib/data/wallets";
import { formatDate, formatMonthShort, formatMonthShortName } from "@/lib/format-date";
import { dateParam, firstParam, type SearchParams } from "@/lib/params";
import { firstDayOfMonth, monthKeyFromDate, monthsBetween, shiftMonth, todayIso } from "@/lib/sheets/schema";

/** Each month is a separate sheet read, so very long ranges are clamped. */
const MAX_MONTHS = 24;
const NET_WORTH_MONTHS = 24;

type Range = { from: string; to: string };

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
  const view = analyticsView(firstParam(query.view));
  const { from, to, clamped } = resolveRange(dateParam(query.from), dateParam(query.to), today);
  const usesRange = view !== "networth";
  const hrefFor = (v: AnalyticsView) =>
    `/analytics?view=${v}${dateParam(query.from) ? `&from=${from}&to=${to}` : ""}`;

  return (
    <>
      <PageHeader
        title="Analitik"
        description={
          usesRange
            ? `${formatDate(from)} – ${formatDate(to)}${clamped ? ` (maks. ${MAX_MONTHS} bulan)` : ""}`
            : "Total saldo dari waktu ke waktu"
        }
      />

      <div className="mb-6 space-y-3">
        <ViewTabs view={view} hrefFor={hrefFor} />
        {usesRange && <RangePicker from={from} to={to} today={today} view={view} />}
      </div>

      {view === "flow" && <CashFlow range={{ from, to }} />}
      {view === "category" && <ByCategory range={{ from, to }} />}
      {view === "wallet" && <ByWallet range={{ from, to }} />}
      {view === "networth" && <NetWorth today={today} />}
    </>
  );
}

async function loadStats(range: Range) {
  const [transactions, wallets, categories, rates] = await Promise.all([
    listTransactionsBetween(range.from, range.to),
    listWallets(),
    listCategories(),
    getRates(),
  ]);
  return { stats: buildDetailedStats(transactions, wallets, categories, rates, range), wallets, rates };
}

async function CashFlow({ range }: { range: Range }) {
  // Each month is a sheet read; past a year the comparison isn't worth the reads.
  const spanMonths = monthsBetween(monthKeyFromDate(range.from), monthKeyFromDate(range.to)).length;
  const previous = spanMonths <= 12 ? previousPeriod(range.from, range.to) : null;
  const [{ stats, wallets, rates }, previousTransactions] = await Promise.all([
    loadStats(range),
    previous ? listTransactionsBetween(previous.from, previous.to) : null,
  ]);
  const net = stats.totalIncome - stats.totalExpense;
  const savingRate = stats.totalIncome > 0 ? (net / stats.totalIncome) * 100 : null;
  const before = previousTransactions && sumIncomeExpense(previousTransactions, wallets, rates);
  const against =
    spanMonths === 1 && previous
      ? formatMonthShortName(previous.from)
      : previous && previous.from.slice(5) === range.from.slice(5) && spanMonths > 6
        ? "tahun lalu"
        : "periode lalu";

  return (
    <div className="space-y-6">
      <div className="empty:hidden">
        <RatesNotice rates={rates} />
      </div>
      <div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Pemasukan"
            value={stats.totalIncome}
            tone="income"
            footer={
              before && <Change current={stats.totalIncome} previous={before.income} goodWhen="up" against={against} />
            }
          />
          <Stat
            label="Pengeluaran"
            value={stats.totalExpense}
            tone="expense"
            footer={
              before && (
                <Change current={stats.totalExpense} previous={before.expense} goodWhen="down" against={against} />
              )
            }
          />
          <Stat label="Selisih" value={net} />
          <Card className="px-4 py-3">
            <p className="text-xs text-muted">Rasio tabungan</p>
            <p className="tabular mt-1 text-base font-semibold">
              {savingRate === null ? "—" : `${savingRate.toFixed(1).replace(".", ",")}%`}
            </p>
          </Card>
        </div>
        {previous && (
          <p className="mt-2 px-1 text-xs text-subtle">
            Dibandingkan dengan {formatDate(previous.from)} – {formatDate(previous.to)}
          </p>
        )}
      </div>

      {stats.trend.points.length > 1 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium text-muted">
            {stats.trend.granularity === "day" ? "Tren harian" : "Tren bulanan"}
          </h2>
          <TrendChart trend={stats.trend} />
        </Card>
      )}
    </div>
  );
}

async function ByCategory({ range }: { range: Range }) {
  const { stats } = await loadStats(range);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Breakdown title="Pengeluaran per kategori" items={stats.expenseByCategory} empty="Belum ada pengeluaran" />
      <Breakdown title="Pemasukan per kategori" items={stats.incomeByCategory} empty="Belum ada pemasukan" />
    </div>
  );
}

async function ByWallet({ range }: { range: Range }) {
  const { stats } = await loadStats(range);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Breakdown title="Pengeluaran per dompet" items={stats.expenseByWallet} empty="Belum ada pengeluaran" />
      <Breakdown title="Pemasukan per dompet" items={stats.incomeByWallet} empty="Belum ada pemasukan" />
    </div>
  );
}

/** Covers the whole history (up to two years), independent of the picked range. */
async function NetWorth({ today }: { today: string }) {
  const [wallets, rates, sheetMonths, history] = await Promise.all([
    listWallets(),
    getRates(),
    listTransactionMonths(),
    listRecentTransactions(NET_WORTH_MONTHS),
  ]);
  const currentMonth = monthKeyFromDate(today);
  const earliest = sheetMonths.find((m) => m >= shiftMonth(currentMonth, -(NET_WORTH_MONTHS - 1)));
  const points = buildNetWorth(
    wallets,
    history,
    rates,
    monthsBetween(earliest && earliest < currentMonth ? earliest : currentMonth, currentMonth)
  );

  if (points.length < 2) {
    return (
      <Card>
        <EmptyState
          icon={<TrendingUp />}
          title="Belum cukup data"
          description="Grafik muncul setelah ada transaksi di lebih dari satu bulan."
        />
      </Card>
    );
  }

  const change = points[points.length - 1].value - points[0].value;
  return (
    <div className="space-y-4">
      <div className="empty:hidden">
        <RatesNotice rates={rates} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total saldo sekarang" value={points[points.length - 1].value} />
        <Card className="px-4 py-3">
          <p className="text-xs text-muted">Sejak {formatMonthShort(points[0].month)}</p>
          <Amount
            value={change}
            tone={change >= 0 ? "income" : "expense"}
            className="mt-1 block whitespace-normal wrap-anywhere text-base font-semibold"
          />
        </Card>
      </div>
      <Card className="p-4">
        <h2 className="text-sm font-medium text-muted">Saldo akhir tiap bulan</h2>
        <p className="mb-3 text-xs text-subtle">Dihitung dengan kurs hari ini</p>
        <NetWorthChart points={points} />
      </Card>
    </div>
  );
}

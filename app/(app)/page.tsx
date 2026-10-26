import Link from "next/link";
import { connection } from "next/server";
import { Wallet as WalletIcon } from "lucide-react";
import { Breakdown } from "@/components/analytics/breakdown";
import { Amount } from "@/components/ui/amount";
import { buttonStyles } from "@/components/ui/button";
import { Card, EmptyState, SectionTitle } from "@/components/ui/misc";
import { Stat } from "@/components/ui/stat";
import { CurrencyTotals } from "@/components/wallets/currency-totals";
import { ExchangeRates } from "@/components/wallets/exchange-rates";
import { buildDetailedStats, totalBalance } from "@/lib/analytics";
import { listCategories } from "@/lib/data/categories";
import { getRates } from "@/lib/data/rates";
import { listTransactions } from "@/lib/data/transactions";
import { listWallets } from "@/lib/data/wallets";
import { formatMonth } from "@/lib/format-date";
import { currentMonthKey, firstDayOfMonth, lastDayOfMonth } from "@/lib/sheets/schema";


export default async function OverviewPage() {
  await connection();
  const month = currentMonthKey();
  const [wallets, categories, transactions, rates] = await Promise.all([
    listWallets(),
    listCategories(),
    listTransactions(month),
    getRates(),
  ]);

  if (wallets.length === 0) {
    return (
      <EmptyState
        icon={<WalletIcon />}
        title="Mulai dengan membuat dompet"
        description="Dompet bisa berupa rekening bank, e-wallet, uang tunai, atau investasi."
        action={<Link href="/wallets" className={buttonStyles()}>Buat dompet</Link>}
        className="py-24"
      />
    );
  }

  const stats = buildDetailedStats(transactions, wallets, categories, rates, {
    from: firstDayOfMonth(month),
    to: lastDayOfMonth(month),
  });
  const balance = totalBalance(wallets, rates);

  return (
    // Flat grid so phones read: balance, rates, this month, currency totals,
    // category totals, while desktop keeps the currency totals in a right-hand column.
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_auto_auto_1fr]">
      <section>
        <Card className="p-5">
          <p className="text-sm text-muted">Total saldo</p>
          <Amount
            value={balance.idr}
            className="mt-1 block whitespace-normal wrap-anywhere text-3xl font-semibold tracking-tight"
          />
          <p className="mt-1 text-sm text-muted">
            ≈ <Amount value={balance.usd} currency="USD" />
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>Kurs</SectionTitle>
        <ExchangeRates rates={rates} />
      </section>

      <section>
        <SectionTitle
          action={
            <Link href="/analytics" className="text-sm text-accent hover:underline">
              Analitik
            </Link>
          }
        >
          {formatMonth(month)}
        </SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Pemasukan" value={stats.totalIncome} tone="income" />
          <Stat label="Pengeluaran" value={stats.totalExpense} tone="expense" />
          <Stat label="Selisih" value={stats.totalIncome - stats.totalExpense} />
        </div>
      </section>

      <section className="lg:col-start-2 lg:row-span-4 lg:row-start-1">
        <SectionTitle
          action={
            <Link href="/wallets" className="text-sm text-accent hover:underline">
              Dompet
            </Link>
          }
        >
          Total per mata uang
        </SectionTitle>
        <CurrencyTotals wallets={wallets} />
      </section>

      <section>
        <SectionTitle
          action={
            <Link href="/transactions" className="text-sm text-accent hover:underline">
              Transaksi
            </Link>
          }
        >
          Per kategori
        </SectionTitle>
        <div className="space-y-4">
          <Breakdown title="Pengeluaran" items={stats.expenseByCategory} empty="Belum ada pengeluaran bulan ini" />
          <Breakdown title="Pemasukan" items={stats.incomeByCategory} empty="Belum ada pemasukan bulan ini" />
        </div>
      </section>
    </div>
  );
}

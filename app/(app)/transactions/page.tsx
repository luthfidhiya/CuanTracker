import { connection } from "next/server";
import { AddTransaction } from "@/components/transactions/add-transaction";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { MonthNav } from "@/components/ui/month-nav";
import { PageHeader } from "@/components/ui/misc";
import { listCategories } from "@/lib/data/categories";
import { getRates } from "@/lib/data/rates";
import { listTransactions } from "@/lib/data/transactions";
import { listWallets } from "@/lib/data/wallets";
import { formatMonth } from "@/lib/format-date";
import { monthParam, type SearchParams } from "@/lib/params";

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  // "This month" depends on today, so this page renders at request time.
  await connection();
  const month = monthParam((await searchParams).month);
  const [transactions, wallets, categories, rates] = await Promise.all([
    listTransactions(month),
    listWallets(),
    listCategories(),
    getRates(),
  ]);
  return (
    <>
      <PageHeader title="Transaksi" actions={<AddTransaction wallets={wallets} categories={categories} />} />
      <div className="mb-5">
        <MonthNav month={month} basePath="/transactions" />
      </div>
      <TransactionsView
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        rates={rates}
        monthLabel={formatMonth(month)}
      />
    </>
  );
}

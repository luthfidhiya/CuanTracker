import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AddTransaction } from "@/components/transactions/add-transaction";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { Amount } from "@/components/ui/amount";
import { Card, ColorDot, PageHeader } from "@/components/ui/misc";
import { MonthNav } from "@/components/ui/month-nav";
import { WalletActions } from "@/components/wallets/wallet-actions";
import { listCategories } from "@/lib/data/categories";
import { getRates } from "@/lib/data/rates";
import { listTransactions } from "@/lib/data/transactions";
import { listWallets } from "@/lib/data/wallets";
import { formatMonth } from "@/lib/format-date";
import { monthParam, type SearchParams } from "@/lib/params";
import { walletTypeLabel } from "@/lib/wallet-types";

export default async function WalletPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const month = monthParam(query.month);
  const [wallets, categories, monthTransactions, rates] = await Promise.all([
    listWallets(),
    listCategories(),
    listTransactions(month),
    getRates(),
  ]);

  const wallet = wallets.find((w) => w.id === id);
  if (!wallet) notFound();
  const transactions = monthTransactions.filter((t) => t.walletId === id || t.toWalletId === id);

  return (
    <>
      <PageHeader
        backHref="/wallets"
        title={wallet.name}
        description={
          <span className="flex items-center gap-2">
            <ColorDot color={wallet.color} />
            {walletTypeLabel(wallet.type)} · {wallet.currencyCode}
          </span>
        }
        actions={<WalletActions wallet={wallet} />}
      />

      <Card className="mb-6 p-5">
        <p className="text-sm text-muted">Saldo</p>
        <Amount
          value={wallet.currentBalance}
          currency={wallet.currencyCode}
          className="mt-1 block text-3xl font-semibold tracking-tight"
        />
      </Card>

      <div className="mb-5 flex items-center justify-between gap-3">
        <MonthNav month={month} basePath={`/wallets/${id}`} />
        <AddTransaction wallets={wallets} categories={categories} defaultWalletId={id} />
      </div>

      <TransactionsView
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        rates={rates}
        monthLabel={formatMonth(month)}
        walletId={id}
      />
    </>
  );
}

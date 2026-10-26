import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/components/shell/app-shell";
import { AddTransaction } from "@/components/transactions/add-transaction";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { listCategories } from "@/lib/data/categories";
import { listWallets } from "@/lib/data/wallets";

/** The global "add transaction" button needs wallets and categories; it streams in on its own. */
async function QuickAdd() {
  await connection();
  const data = await Promise.all([listWallets(), listCategories()]).catch((error) => {
    // Pages show their own error; keep the shell usable.
    console.error("[layout] could not load wallets for quick add:", error);
    return null;
  });
  if (!data) return <AddTransaction variant="nav" wallets={[]} categories={[]} disabled />;
  return <AddTransaction variant="nav" wallets={data[0]} categories={data[1]} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const spreadsheetUrl = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : undefined;

  return (
    // The shell reads the pathname. For dynamic routes (/wallets/[id]) that is only
    // known at request time, so their prerendered shell shows this fallback briefly.
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 pt-20 lg:px-10">
          <PageSkeleton />
        </div>
      }
    >
      <AppShell
        spreadsheetUrl={spreadsheetUrl}
        addTransaction={
          <Suspense fallback={<AddTransaction variant="nav" wallets={[]} categories={[]} disabled />}>
            <QuickAdd />
          </Suspense>
        }
      >
        {children}
      </AppShell>
    </Suspense>
  );
}

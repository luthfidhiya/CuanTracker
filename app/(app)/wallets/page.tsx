import { connection } from "next/server";
import { Wallet as WalletIcon } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { AddWallet } from "@/components/wallets/wallet-actions";
import { WalletBrowser } from "@/components/wallets/wallet-browser";
import { listWallets } from "@/lib/data/wallets";

export default async function WalletsPage() {
  await connection();
  const wallets = await listWallets();

  return (
    <>
      <PageHeader
        title="Dompet"
        description={wallets.length > 0 ? `${wallets.length} dompet` : undefined}
        actions={<AddWallet />}
      />
      {wallets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<WalletIcon />}
            title="Belum ada dompet"
            description="Tambahkan rekening bank, e-wallet, uang tunai, atau investasi."
          />
        </Card>
      ) : (
        <WalletBrowser wallets={wallets} />
      )}
    </>
  );
}

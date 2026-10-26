import Link from "next/link";
import { Wallet as WalletIcon } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function WalletNotFound() {
  return (
    <EmptyState
      icon={<WalletIcon />}
      title="Dompet tidak ditemukan"
      description="Dompet ini mungkin sudah dihapus."
      action={<Link href="/wallets" className={buttonStyles({ variant: "secondary" })}>Ke daftar dompet</Link>}
      className="py-24"
    />
  );
}

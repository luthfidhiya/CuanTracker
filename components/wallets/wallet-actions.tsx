"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteWallet, getWalletDeleteImpact } from "@/app/actions/wallets";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sheet } from "@/components/ui/sheet";
import type { Wallet } from "@/lib/types";
import { WalletForm } from "./wallet-form";

export function AddWallet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Dompet baru"
      trigger={
        <Button>
          <Plus className="size-4" />
          Dompet
        </Button>
      }
    >
      <WalletForm onDone={() => setOpen(false)} />
    </Sheet>
  );
}

export function WalletActions({ wallet }: { wallet: Wallet }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [impact, setImpact] = useState<number | null>(null);
  const [checking, startChecking] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const askDelete = () =>
    startChecking(async () => {
      try {
        setImpact(await getWalletDeleteImpact(wallet.id));
      } catch {
        toast.error("Gagal memeriksa transaksi dompet. Coba lagi.");
      }
    });

  const confirmDelete = () =>
    startDeleting(async () => {
      const result = await deleteWallet(wallet.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Dompet ${wallet.name} dihapus`);
      router.replace("/wallets");
    });

  return (
    <>
      <Sheet
        open={editing}
        onOpenChange={setEditing}
        title="Ubah dompet"
        trigger={
          <Button variant="secondary" size="icon" aria-label="Ubah dompet">
            <Pencil className="size-4" />
          </Button>
        }
      >
        <WalletForm initial={wallet} onDone={() => setEditing(false)} />
      </Sheet>

      <Button variant="secondary" size="icon" aria-label="Hapus dompet" onClick={askDelete} loading={checking}>
        {!checking && <Trash2 className="size-4" />}
      </Button>

      <ConfirmDialog
        open={impact !== null}
        onOpenChange={(open) => !open && setImpact(null)}
        title={`Hapus dompet ${wallet.name}?`}
        description={
          impact === 0 ? (
            "Dompet ini belum punya transaksi. Tindakan ini tidak bisa dibatalkan."
          ) : (
            <>
              <span className="text-fg">{impact} transaksi ikut terhapus</span>, termasuk transfer dari dan
              ke dompet ini. Saldo dompet tujuan atau asal transfer tersebut akan ikut berubah. Tindakan ini
              tidak bisa dibatalkan.
            </>
          )
        }
        confirmLabel="Hapus dompet"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  );
}

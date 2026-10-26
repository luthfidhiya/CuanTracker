"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Category, Wallet } from "@/lib/types";
import { TransactionForm } from "./transaction-form";

/**
 * "Add transaction" trigger plus its sheet.
 * - `nav`: the round button in the mobile bottom bar, a full-width button in the desktop sidebar.
 * - `button`: a regular page action.
 */
export function AddTransaction({
  wallets,
  categories,
  defaultWalletId,
  variant = "button",
  disabled = false,
}: {
  wallets: Wallet[];
  categories: Category[];
  defaultWalletId?: string;
  variant?: "nav" | "button";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const trigger =
    variant === "nav" ? (
      <button
        type="button"
        disabled={disabled}
        aria-label="Tambah transaksi"
        className={cn(
          "grid size-12 cursor-pointer place-items-center rounded-full bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50",
          "lg:flex lg:h-10 lg:w-full lg:items-center lg:justify-center lg:gap-2 lg:rounded-lg lg:text-sm lg:font-medium"
        )}
      >
        <Plus className="size-6 lg:size-4" />
        <span className="hidden lg:inline">Tambah transaksi</span>
      </button>
    ) : (
      <Button disabled={disabled}>
        <Plus className="size-4" />
        Tambah
      </Button>
    );

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Tambah transaksi" trigger={trigger}>
      <TransactionForm
        wallets={wallets}
        categories={categories}
        defaultWalletId={defaultWalletId}
        onDone={() => setOpen(false)}
      />
    </Sheet>
  );
}

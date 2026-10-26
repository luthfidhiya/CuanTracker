"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/choice";
import type { WalletWithBalance } from "@/lib/types";
import { WALLET_TYPES, walletTypeLabel } from "@/lib/wallet-types";
import { WalletCards } from "./wallet-cards";

const ALL = "all";

/** Wallet cards with a type filter on top; the filter only lists types that have wallets. */
export function WalletBrowser({ wallets }: { wallets: WalletWithBalance[] }) {
  const [type, setType] = useState<string>(ALL);
  const present = new Set(wallets.map((w) => w.type));
  // Known types in their usual order, then anything typed by hand in the sheet.
  const types = [
    ...WALLET_TYPES.filter((t) => present.has(t)),
    ...[...present].filter((t) => !(WALLET_TYPES as readonly string[]).includes(t)),
  ];
  const active = type === ALL || present.has(type) ? type : ALL;
  const shown = active === ALL ? wallets : wallets.filter((w) => w.type === active);

  return (
    <>
      {types.length > 1 && (
        <div className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <Segmented
            label="Jenis dompet"
            value={active}
            onChange={setType}
            options={[
              { value: ALL, label: "Semua" },
              ...types.map((t) => ({ value: t, label: walletTypeLabel(t) })),
            ]}
            className="w-max min-w-full"
          />
        </div>
      )}
      <WalletCards wallets={shown} />
    </>
  );
}

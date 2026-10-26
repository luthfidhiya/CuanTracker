"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createWallet, updateWallet } from "@/app/actions/wallets";
import { Button } from "@/components/ui/button";
import { ColorPicker, PALETTE } from "@/components/ui/choice";
import { Field, Input, Select } from "@/components/ui/input";
import { CurrencyMark, markPadding } from "@/components/ui/currency-mark";
import { CURRENCIES } from "@/lib/currencies";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import type { Wallet } from "@/lib/types";
import { WALLET_TYPES, WALLET_TYPE_LABELS, type WalletType } from "@/lib/wallet-types";

/** Create a wallet, or edit name/type/color of an existing one (currency and opening balance are fixed). */
export function WalletForm({ initial, onDone }: { initial?: Wallet; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<WalletType>((initial?.type as WalletType) ?? "Bank");
  const [color, setColor] = useState(initial?.color ?? PALETTE[7]);
  const [currencyCode, setCurrencyCode] = useState(initial?.currencyCode ?? "IDR");
  const [balanceText, setBalanceText] = useState("");
  const [saving, startSaving] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startSaving(async () => {
      const result = initial
        ? await updateWallet(initial.id, { name, type, color })
        : await createWallet({
            name,
            type,
            color,
            currencyCode,
            initialBalance: parseAmountInput(balanceText),
          });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(initial ? "Dompet diperbarui" : "Dompet dibuat");
      onDone();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-1">
      <Field label="Nama" htmlFor="wallet-name">
        <Input
          id="wallet-name"
          required
          maxLength={60}
          placeholder="Contoh: BCA, GoPay, Dompet"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Jenis" htmlFor="wallet-type">
          <Select id="wallet-type" value={type} onChange={(e) => setType(e.target.value as WalletType)}>
            {WALLET_TYPES.map((t) => (
              <option key={t} value={t}>{WALLET_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Mata uang" htmlFor="wallet-currency">
          <Select
            id="wallet-currency"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            disabled={!!initial}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      {!initial && (
        <Field label="Saldo awal" htmlFor="wallet-balance" hint="Saldo saat ini sebelum transaksi pertama dicatat.">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <CurrencyMark code={currencyCode} />
            </span>
            <Input
              id="wallet-balance"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={balanceText}
              onChange={(e) => setBalanceText(formatAmountInput(e.target.value))}
              className="tabular"
              style={{ paddingLeft: markPadding(currencyCode) }}
            />
          </div>
        </Field>
      )}

      {initial && (
        <p className="text-sm text-muted">Mata uang dan saldo awal tidak bisa diubah setelah dompet dibuat.</p>
      )}

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={saving}>
        {initial ? "Simpan perubahan" : "Buat dompet"}
      </Button>
    </form>
  );
}

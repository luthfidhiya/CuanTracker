"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Wallet as WalletIcon } from "lucide-react";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/app/actions/transactions";
import { Button, buttonStyles } from "@/components/ui/button";
import { Segmented } from "@/components/ui/choice";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CurrencyMark, markPadding } from "@/components/ui/currency-mark";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { formatDate } from "@/lib/format-date";
import { formatAmountInput, formatMoney, parseAmountInput } from "@/lib/money";
import { todayIso } from "@/lib/sheets/schema";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Pengeluaran" },
  { value: "INCOME", label: "Pemasukan" },
  { value: "TRANSFER", label: "Transfer" },
];

export interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  /** Editing an existing transaction. */
  initial?: Transaction;
  /** Prefills a new transaction from an existing one ("Catat lagi"); the date starts at today. */
  template?: Transaction;
  /** Preselected source wallet for a new transaction. */
  defaultWalletId?: string;
  /** While editing: offers "Catat lagi", which hands the transaction over to be recorded anew. */
  onRecordAgain?: (transaction: Transaction) => void;
  /** Called after a successful save or delete. */
  onDone: () => void;
}

export function TransactionForm({
  wallets,
  categories,
  initial,
  template,
  defaultWalletId,
  onRecordAgain,
  onDone,
}: TransactionFormProps) {
  const source = initial ?? template;
  const [type, setType] = useState<TransactionType>(source?.type ?? "EXPENSE");
  const [amountText, setAmountText] = useState(
    // Full precision so editing a crypto amount doesn't round it.
    source ? source.amount.toLocaleString("id-ID", { maximumFractionDigits: 10 }) : ""
  );
  const [walletId, setWalletId] = useState(source?.walletId ?? defaultWalletId ?? wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState(source?.toWalletId ?? "");
  const [category, setCategory] = useState(source?.category ?? "");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(source?.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  if (wallets.length === 0) {
    return (
      <EmptyState
        icon={<WalletIcon />}
        title="Belum ada dompet"
        description="Buat dompet dulu sebelum mencatat transaksi."
        action={
          <Link href="/wallets" onClick={onDone} className={buttonStyles()}>
            Buat dompet
          </Link>
        }
        className="pb-6 pt-2"
      />
    );
  }

  const sourceWallet = wallets.find((w) => w.id === walletId);
  const currency = sourceWallet?.currencyCode ?? "IDR";
  const transferTargets = wallets.filter((w) => w.id !== walletId && w.currencyCode === currency);
  const categoryOptions = categories.filter((c) => c.type === type);
  // A category deleted after this transaction was recorded stays selectable while editing.
  const keepsOldCategory = !!category && type !== "TRANSFER" && !categoryOptions.some((c) => c.name === category);

  const changeType = (next: TransactionType) => {
    setType(next);
    if (next !== type) setCategory("");
  };

  const changeSource = (next: string) => {
    setWalletId(next);
    const target = wallets.find((w) => w.id === toWalletId);
    const nextCurrency = wallets.find((w) => w.id === next)?.currencyCode;
    if (target && (target.id === next || target.currencyCode !== nextCurrency)) setToWalletId("");
  };

  const formInput = () => ({
    type,
    amount: parseAmountInput(amountText),
    walletId,
    toWalletId: type === "TRANSFER" ? toWalletId : undefined,
    category: type === "TRANSFER" ? "" : category,
    description,
    date,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = formInput();
    startSaving(async () => {
      const result = initial
        ? await updateTransaction({ id: initial.id, date: initial.date }, input)
        : await createTransaction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(initial ? "Transaksi diperbarui" : "Transaksi disimpan");
      onDone();
    });
  };

  const remove = () => {
    if (!initial) return;
    startDeleting(async () => {
      const result = await deleteTransaction({ id: initial.id, date: initial.date });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmDelete(false);
      toast.success("Transaksi dihapus");
      onDone();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-1">
      <Segmented label="Jenis transaksi" value={type} onChange={changeType} options={TYPE_OPTIONS} />

      <Field label={`Jumlah (${currency})`} htmlFor="tx-amount">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <CurrencyMark code={currency} />
          </span>
          <Input
            id="tx-amount"
            required
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
            className="tabular h-12 text-lg font-medium"
            style={{ paddingLeft: markPadding(currency) }}
          />
        </div>
      </Field>

      {type === "TRANSFER" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari" htmlFor="tx-from">
            <Select id="tx-from" value={walletId} onChange={(e) => changeSource(e.target.value)}>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ke" htmlFor="tx-to">
            <Select id="tx-to" required value={toWalletId} onChange={(e) => setToWalletId(e.target.value)}>
              <option value="" disabled>
                {transferTargets.length ? "Pilih dompet" : `Tidak ada dompet ${currency} lain`}
              </option>
              {transferTargets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori" htmlFor="tx-category">
            <Select id="tx-category" required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" disabled>Pilih kategori</option>
              {keepsOldCategory && <option value={category}>{category}</option>}
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Dompet" htmlFor="tx-wallet">
            <Select id="tx-wallet" value={walletId} onChange={(e) => changeSource(e.target.value)}>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {type !== "TRANSFER" && categoryOptions.length === 0 && (
        <p className="text-sm text-muted">
          Belum ada kategori {type === "INCOME" ? "pemasukan" : "pengeluaran"}.{" "}
          <Link href="/categories" onClick={onDone} className="text-accent hover:underline">
            Tambah kategori
          </Link>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" htmlFor="tx-date">
          <Input id="tx-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Catatan" htmlFor="tx-note">
          <Input
            id="tx-note"
            placeholder="Opsional"
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-2 pt-2">
        {initial && (
          <>
            <Button variant="secondary" className="text-danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
              Hapus
            </Button>
            {onRecordAgain && (
              <Button variant="secondary" onClick={() => onRecordAgain(initial)} disabled={saving || deleting}>
                <Copy className="size-4" />
                Catat lagi
              </Button>
            )}
          </>
        )}
        <Button type="submit" size="lg" className="flex-1" loading={saving} disabled={deleting}>
          {initial ? "Simpan perubahan" : "Simpan"}
        </Button>
      </div>

      {initial && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Hapus transaksi?"
          description={
            <>
              <span className="text-fg">
                {initial.type === "TRANSFER" ? "Transfer" : initial.category} ·{" "}
                {formatMoney(initial.amount, currency)} · {formatDate(initial.date)}
              </span>
              <br />
              Saldo dompet akan dihitung ulang. Tindakan ini tidak bisa dibatalkan.
            </>
          }
          onConfirm={remove}
          loading={deleting}
        />
      )}
    </form>
  );
}

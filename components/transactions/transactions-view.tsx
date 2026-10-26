"use client";

import { useMemo, useState } from "react";
import { ReceiptText, Search, SlidersHorizontal } from "lucide-react";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/choice";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { sumIncomeExpense } from "@/lib/analytics";
import type { ExchangeRates } from "@/lib/exchange";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types";
import { TransactionList } from "./transaction-list";

type Filter = "ALL" | TransactionType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "EXPENSE", label: "Keluar" },
  { value: "INCOME", label: "Masuk" },
  { value: "TRANSFER", label: "Transfer" },
];

const ANY = "";

/**
 * Filtering happens on the already-loaded month, so it is instant.
 * With `walletId` (a wallet's own page) the wallet filter and totals are left out.
 */
export function TransactionsView({
  transactions,
  wallets,
  categories,
  rates,
  monthLabel,
  walletId,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  rates: ExchangeRates;
  /** "Agustus 2026", for the empty state. */
  monthLabel: string;
  walletId?: string;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [walletFilter, setWalletFilter] = useState(ANY);
  const [categoryFilter, setCategoryFilter] = useState(ANY);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const walletName = useMemo(() => new Map(wallets.map((w) => [w.id, w.name.toLowerCase()])), [wallets]);
  // Only categories that occur this month, so every choice gives results.
  const usedCategories = useMemo(
    () => [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id")),
    [transactions]
  );

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText />}
        title={`Belum ada transaksi di ${monthLabel}`}
        description="Catat transaksi lewat tombol tambah."
      />
    );
  }

  const q = query.trim().toLowerCase();
  // "45000" or "45.000" both find Rp 45.000.
  const digits = q.replace(/[.\s]/g, "").replace(",", ".");
  const matchesQuery = (t: Transaction) =>
    !q ||
    t.category.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    !!walletName.get(t.walletId)?.includes(q) ||
    (!!t.toWalletId && !!walletName.get(t.toWalletId)?.includes(q)) ||
    (/^\d+(\.\d+)?$/.test(digits) && String(t.amount).includes(digits));

  const visible = transactions.filter(
    (t) =>
      (filter === "ALL" || t.type === filter) &&
      (walletFilter === ANY || t.walletId === walletFilter || t.toWalletId === walletFilter) &&
      (categoryFilter === ANY || t.category === categoryFilter) &&
      matchesQuery(t)
  );
  const filtered = filter !== "ALL" || walletFilter !== ANY || categoryFilter !== ANY || !!q;
  const totals = sumIncomeExpense(visible, wallets, rates);
  const activeFilters = [filter !== "ALL", walletFilter !== ANY, categoryFilter !== ANY].filter(Boolean).length;
  const filterSummary = [
    filter !== "ALL" && FILTERS.find((f) => f.value === filter)?.label,
    walletFilter !== ANY && wallets.find((w) => w.id === walletFilter)?.name,
    categoryFilter !== ANY && categoryFilter,
  ]
    .filter(Boolean)
    .join(" · ");
  const resetFilters = () => {
    setFilter("ALL");
    setWalletFilter(ANY);
    setCategoryFilter(ANY);
  };
  const showIncome = filter === "ALL" || filter === "INCOME";
  const showExpense = filter === "ALL" || filter === "EXPENSE";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            type="search"
            placeholder="Cari kategori, catatan, dompet, nominal"
            aria-label="Cari transaksi"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Sheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          title="Filter transaksi"
          trigger={
            <Button variant="secondary" size="icon" aria-label="Filter" className="relative shrink-0">
              <SlidersHorizontal className="size-4" />
              {activeFilters > 0 && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-fg">
                  {activeFilters}
                </span>
              )}
            </Button>
          }
        >
          <div className="space-y-4">
            <Field label="Jenis">
              <Segmented label="Jenis" value={filter} onChange={setFilter} options={FILTERS} />
            </Field>
            {!walletId && (
              <Field label="Dompet" htmlFor="filter-wallet">
                <Select id="filter-wallet" value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}>
                  <option value={ANY}>Semua dompet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Kategori" htmlFor="filter-category">
              <Select id="filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value={ANY}>Semua kategori</option>
                {usedCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={resetFilters} disabled={activeFilters === 0}>
                Reset
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setFiltersOpen(false)}>
                Tampilkan {visible.length} transaksi
              </Button>
            </div>
          </div>
        </Sheet>
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-2 px-1 text-xs text-muted">
          <span className="min-w-0 truncate">
            {filtered ? `${visible.length} dari ${transactions.length} transaksi` : `${transactions.length} transaksi`}
            {filterSummary && ` · ${filterSummary}`}
          </span>
          {activeFilters > 0 && (
            <button type="button" onClick={resetFilters} className="shrink-0 cursor-pointer text-accent hover:underline">
              Reset
            </button>
          )}
        </p>
        {/* Side-by-side boxes: two amounts on one text line don't fit on phones. */}
        {!walletId && (showIncome || showExpense) && (
          <div className="flex divide-x divide-border rounded-(--radius-card) border border-border bg-surface">
            {showIncome && <Total label="Masuk" value={totals.income} tone="income" />}
            {showExpense && <Total label="Keluar" value={totals.expense} tone="expense" />}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Search />} title="Tidak ada yang cocok" description="Coba kata kunci atau filter lain." />
      ) : (
        <TransactionList
          transactions={visible}
          wallets={wallets}
          categories={categories}
          rates={rates}
          walletId={walletId}
        />
      )}
    </div>
  );
}

function Total({ label, value, tone }: { label: string; value: number; tone: "income" | "expense" }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <Amount value={value} tone={tone} className="block whitespace-normal wrap-anywhere text-sm font-semibold" />
    </div>
  );
}

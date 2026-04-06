"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Transaction, Wallet, Category } from "@/lib/types";
import { GlassCard } from "./ui/glass-card";
import { format, parseISO } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  X,
  Trash2,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { deleteTransaction, getTransactions } from "@/app/actions";
import * as Dialog from "@radix-ui/react-dialog";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { TransactionForm } from "./TransactionForm";

interface TransactionListProps {
  transactions: Transaction[];
  wallets?: Wallet[];
  categories?: Category[];
}

type FilterType = "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";

export function TransactionList({
  transactions: initialTransactions,
  wallets = [],
  categories = [],
}: TransactionListProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    date: string;
  } | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // function to refresh transactions after an add/edit
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const date = new Date(`${selectedMonth}-01`);
      const data = await getTransactions(date);
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const filteredTransactions = transactions.filter((t) => {
    const matchesQuery =
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase());
    const matchesType = filterType === "ALL" || t.type === filterType;
    return matchesQuery && matchesType;
  });

  const handleDelete = () => {
    if (!confirmDelete) return;
    const targetId = confirmDelete.id;
    const targetDate = confirmDelete.date;
    setConfirmDelete(null); // optimistic close
    
    startTransition(async () => {
      try {
        await deleteTransaction(targetId, targetDate);
        await fetchTransactions(); // refresh local state
      } catch {
        console.error("Failed to delete transaction");
      }
    });
  };

  return (
    <div className="space-y-6 lg:bg-slate-950/50 lg:backdrop-blur-xl lg:p-8 lg:rounded-[32px] lg:border lg:border-white/5 lg:shadow-2xl relative">

      {/* Sync Overlay */}
      {(loading || isPending) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-[32px]">
          <Loader2 className="animate-spin mb-3 text-blue-400/50" size={36} />
          <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">
            Syncing Ledger...
          </p>
        </div>
      )}

      {/* Header Controls */}
      <div className="space-y-4 lg:flex lg:space-y-0 lg:justify-between lg:items-center">
        <div className="flex justify-between items-center px-1 lg:px-0">
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 lg:w-[300px]">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <Input
                  autoFocus
                  placeholder="Search logs..."
                  className="h-10 pl-9 bg-slate-900/50 border-white/10 rounded-xl"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close Search"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 justify-between w-full">
              <div>
                <h2 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter capitalize">
                  Activity Logs
                </h2>
                <p className="text-xs text-blue-400/50 font-bold capitalize tracking-[0.2em] mt-0 lg:mt-0">
                  Transaction History
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3 lg:mt-0">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-900/50 border border-white/10 text-white text-xs rounded-xl px-4 py-2 h-10 focus:outline-none focus:border-blue-500/50 font-bold capitalize tracking-wider transition-colors cursor-pointer"
                />
                <button
                  onClick={() => setSearchOpen(true)}
                  className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                  aria-label="Open Search"
                >
                  <Search size={18} />
                </button>
                <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
                  <Dialog.Trigger asChild>
                    <button className="h-10 px-3 lg:px-4 shrink-0 flex items-center justify-center gap-2 rounded-xl bg-linear-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer group">
                      <Plus size={18} />
                      <span className="hidden lg:block font-bold tracking-widest text-xs capitalize">
                        Add Record
                      </span>
                    </button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl focus:outline-none z-70 animate-in zoom-in-95 duration-300 overflow-y-auto">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                            Add Record
                          </Dialog.Title>
                          <p className="text-blue-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                            Data Entry
                          </p>
                        </div>
                        <Dialog.Close asChild>
                          <button
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
                            aria-label="Close"
                          >
                            <X size={20} />
                          </button>
                        </Dialog.Close>
                      </div>
                      <TransactionForm
                        wallets={wallets}
                        categories={categories}
                        onStartSubmit={() => {
                          setAddOpen(false);
                          setLoading(true);
                        }}
                        onSuccess={() => {
                          startTransition(async () => {
                            await fetchTransactions();
                          });
                        }}
                      />
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar lg:shrink-0">
          {(["ALL", "INCOME", "EXPENSE", "TRANSFER"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "flex-1 lg:flex-none lg:px-6 py-2 rounded-xl text-xs font-bold capitalize tracking-widest transition-all min-w-[70px]",
                filterType === type
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 min-h-[300px]">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const walletName = wallets.find((w) => w.id === t.walletId)?.name;
            const toWalletName = wallets.find(
              (w) => w.id === t.toWalletId
            )?.name;
            return (
              <GlassCard
                key={t.id}
                className="p-4 lg:p-5 flex items-center justify-between hover:bg-slate-800/80 transition-all duration-300 border-white/5 group bg-slate-900/40 relative shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-inner",
                      t.type === "INCOME"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : t.type === "TRANSFER"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {t.type === "INCOME" ? (
                      <ArrowDownLeft size={22} />
                    ) : t.type === "TRANSFER" ? (
                      <ArrowRightLeft size={22} />
                    ) : (
                      <ArrowUpRight size={22} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-black text-white tracking-tight group-hover:text-blue-300 transition-colors">
                      {t.type === "TRANSFER" ? "Transfer" : t.category}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 capitalize tracking-widest">
                        {format(parseISO(t.date), "dd MMM")}
                      </span>
                      {t.description && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                          <span className="text-xs font-semibold text-slate-400 truncate max-w-[100px]">
                            {t.description}
                          </span>
                        </>
                      )}
                    </div>
                    {walletName && (
                      <div className="mt-0.5">
                        {t.type === "TRANSFER" ? (
                          <span className="text-[10px] font-bold tracking-wider text-purple-400/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            {walletName} → {toWalletName ?? "?"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold tracking-wider text-slate-400/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                            {walletName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p
                    className={cn(
                      "text-base font-black tracking-tighter",
                      t.type === "INCOME"
                        ? "text-green-400"
                        : t.type === "TRANSFER"
                        ? "text-purple-400"
                        : "text-red-400"
                    )}
                  >
                    {t.type === "EXPENSE" ? "-" : "+"}
                    <span className="text-xs mr-1 opacity-50 font-medium">
                      Rp
                    </span>
                    {t.amount.toLocaleString("id-ID")}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTransaction(t)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDelete({ id: t.id, date: t.date })
                      }
                      disabled={isPending}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        ) : (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-6">
              <ArrowRightLeft size={32} className="opacity-50" />
            </div>
            <p className="text-sm font-bold capitalize tracking-[0.2em] text-slate-400">
              {query ? "No match found" : "No Activity Detected"}
            </p>
          </div>
        )}
      </div>


      <Dialog.Root
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl focus:outline-none z-50 animate-in zoom-in-95 duration-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                  Edit Entry
                </Dialog.Title>
                <p className="text-blue-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                  Update Record
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            {editingTransaction && (
              <TransactionForm
                wallets={wallets}
                categories={categories}
                initialData={editingTransaction}
                onStartSubmit={() => {
                  setEditingTransaction(null);
                  setLoading(true);
                }}
                onSuccess={() => {
                  startTransition(async () => {
                    await fetchTransactions();
                  });
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Transaction?"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={handleDelete}
        loading={isPending}
        variant="danger"
      />
    </div>
  );
}

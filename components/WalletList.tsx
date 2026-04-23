"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Wallet, Transaction, Category } from "@/lib/types";
import { GlassCard } from "./ui/glass-card";
import {
  Plus,
  LayoutGrid,
  Info,
  CreditCard,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Trash2,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  addWallet,
  editWallet,
  getTransactions,
  deleteTransaction,
  deleteWallet,
  getWallets,
  getCategories,
} from "@/app/actions";
import { usePrivacy, maskAmount } from "./PrivacyContext";
import { useRefresh } from "./RefreshContext";

import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { TransactionForm } from "./TransactionForm";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { CURRENCIES, getCurrency } from "@/lib/currencies";

const COLORS = [
  "#3b82f6", // Blue
  "#0ea5e9", // Sky
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#8b5cf6", // Violet
  "#6366f1", // Indigo
  "#c026d3", // Fuchsia
  "#e11d48", // Rose
];

export function WalletList({
  focusWalletId,
  onClearFocus,
}: {
  focusWalletId?: string | null;
  onClearFocus?: () => void;
}) {
  const { isHidden } = usePrivacy();
  const { refreshKey, triggerRefresh } = useRefresh();
  const [wallets, setWallets] = useState<(Wallet & { currentBalance: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedWallet, setSelectedWallet] = useState<
    (Wallet & { currentBalance: number }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (focusWalletId && wallets.length > 0) {
      const walletToFocus = wallets.find((w) => w.id === focusWalletId);
      if (walletToFocus) {
        setSelectedWallet(walletToFocus);
      }
    }
  }, [focusWalletId, wallets]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [w, c] = await Promise.all([getWallets(), getCategories()]);
        setWallets(w);
        setCategories(c);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);
  const [confirmDeleteWalletId, setConfirmDeleteWalletId] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Bank",
    initialBalance: "0",
    color: COLORS[0],
    currencyCode: "IDR",
    currencySymbol: "Rp",
  });

  const handleDeleteWallet = () => {
    if (!confirmDeleteWalletId) return;
    const targetId = confirmDeleteWalletId;
    setConfirmDeleteWalletId(null); // optimistic close
    
    startTransition(async () => {
      try {
        await deleteWallet(targetId);
        if (selectedWallet?.id === targetId) {
          setSelectedWallet(null);
        }
        await new Promise((r) => setTimeout(r, 600));
        triggerRefresh();
      } catch (error) {
        console.error("Failed to delete wallet", error);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false); // optimistic close
    
    startTransition(async () => {
      try {
        await addWallet({
          name: formData.name,
          type: formData.type,
          initialBalance: parseFloat(formData.initialBalance.replace(/\D/g, "")) || 0,
          color: formData.color,
          currencyCode: formData.currencyCode,
          currencySymbol: formData.currencySymbol,
        });
        setFormData({
          name: "",
          type: "Bank",
          initialBalance: "0",
          color: COLORS[0],
          currencyCode: "IDR",
          currencySymbol: "Rp",
        });
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;
    
    const targetId = editingWallet.id;
    const updateData = {
      name: editingWallet.name,
      type: editingWallet.type,
      color: editingWallet.color,
    };
    
    setEditingWallet(null);
    startTransition(async () => {
      try {
        await editWallet(targetId, updateData);
        await new Promise((r) => setTimeout(r, 600));
        triggerRefresh();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numValue = parseInt(value) || 0;
    setFormData({
      ...formData,
      initialBalance: numValue.toLocaleString("id-ID"),
    });
  };

  if (selectedWallet) {
    return (
      <WalletDetail
        wallet={selectedWallet}
        wallets={wallets}
        categories={categories}
        onBack={() => {
          setSelectedWallet(null);
          if (onClearFocus) onClearFocus();
        }}
      />
    );
  }

  if (loading && wallets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-400/50" size={36} />
          <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">Loading Wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:bg-slate-950/50 lg:backdrop-blur-xl lg:p-8 lg:rounded-[32px] lg:border lg:border-white/5 lg:shadow-2xl min-h-[500px] relative">

      {/* Sync Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-[32px]">
          <Loader2 className="animate-spin mb-3 text-blue-400/50" size={36} />
          <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">
            Syncing Vaults...
          </p>
        </div>
      )}

      <div className="flex justify-between items-center px-1 lg:px-0">
        <div>
          <h2 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter capitalize relative inline-block">
            Wallet Matrix
          </h2>
          <p className="text-xs text-cyan-400/50 font-bold capitalize tracking-[0.2em] mt-0">
            Tap a card to view transactions
          </p>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="h-12 lg:h-12 lg:px-6 w-12 lg:w-auto flex items-center justify-center lg:gap-2 rounded-xl bg-linear-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer group">
              <Plus size={20} />
              <span className="hidden lg:block font-bold tracking-widest text-xs capitalize">
                New Wallet
              </span>
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
            <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-70 animate-in zoom-in-95 focus:outline-none">
              <div className="mb-6">
                <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                  Deploy Node
                </Dialog.Title>
                <p className="text-cyan-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                  Initialize new wallet
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Wallet Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Main Bank"
                    className="bg-slate-900/50"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 rounded-xl bg-slate-900/50 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="Bank" className="bg-slate-900">
                        Bank
                      </option>
                      <option value="E-Wallet" className="bg-slate-900">
                        E-Wallet
                      </option>
                      <option value="Cash" className="bg-slate-900">
                        Cash
                      </option>
                      <option value="Investment" className="bg-slate-900">
                        Investment
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 rounded-xl bg-slate-900/50 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                      value={formData.currencyCode}
                      onChange={(e) => {
                        const cur = getCurrency(e.target.value);
                        setFormData({ ...formData, currencyCode: cur.code, currencySymbol: cur.symbol });
                      }}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-slate-900">
                          {c.symbol} — {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Initial Balance ({formData.currencyCode})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold z-10 pointer-events-none">
                      {formData.currencySymbol}
                    </span>
                    <Input
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formData.initialBalance}
                      onChange={handleBalanceChange}
                      className={cn(
                        "h-12 bg-slate-900/50 border-white/10 text-white font-bold",
                        formData.currencySymbol.length > 3 ? "pl-20" : formData.currencySymbol.length > 2 ? "pl-16" : "pl-12"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Color Profile
                  </label>
                  <div className="flex gap-2.5 flex-wrap px-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={cn(
                          "h-8 w-8 rounded-full transition-all duration-300 relative",
                          formData.color === c
                            ? "scale-110 shadow-[0_0_15px_currentColor]"
                            : "opacity-50 hover:opacity-100 hover:scale-105"
                        )}
                        style={{ backgroundColor: c, color: c }}
                      >
                        {formData.color === c && (
                          <span className="absolute inset-0 rounded-full border-2 border-white pointer-events-none"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-14 rounded-2xl mt-4 font-bold bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400"
                >
                  {isPending ? "Deploying..." : "Initialize Wallet"}
                </Button>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6 lg:mt-6">
          {wallets.map((wallet) => (
            <GlassCard
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet)}
              className="p-6 relative overflow-hidden group border-white/10 bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] cursor-pointer h-48 flex flex-col justify-between"
            >
              {/* Holographic / Gradient Card Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30 bg-linear-to-br from-transparent to-current"
                style={{ color: wallet.color }}
              />
              {/* Top Right Orb */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: wallet.color }}
              />

              <div className="flex justify-between items-start relative z-10 w-full">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-inner relative"
                    style={{
                      backgroundColor: `${wallet.color}20`,
                      color: wallet.color,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-xl border opacity-30"
                      style={{ borderColor: wallet.color }}
                    ></div>
                    <CreditCard size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em] block">
                      {wallet.type}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-none">
                      {wallet.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingWallet(wallet);
                    }}
                    disabled={isPending}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-400/50 hover:text-blue-400 hover:bg-blue-400/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteWalletId(wallet.id);
                    }}
                    disabled={isPending}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                  {/* Fake Chip for aesthetics */}
                  <div className="h-6 w-8 rounded bg-yellow-600/20 border border-yellow-500/30 flex flex-col justify-evenly p-1 overflow-hidden opacity-50">
                    <div className="h-px w-full bg-yellow-500/30"></div>
                    <div className="h-px w-full bg-yellow-500/30"></div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-auto w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-400 capitalize tracking-widest">
                    Current Balance
                  </span>
                  <Info size={12} className="text-slate-500" />
                </div>
                <p className="text-3xl font-black text-white tracking-widest shadow-black drop-shadow-md transition-all">
                  {isHidden ? (
                    <>••••••</>
                  ) : (
                    <>
                      <span className="text-sm mr-1.5 opacity-50 font-medium">{wallet.currencySymbol}</span>
                      {wallet.currentBalance.toLocaleString("id-ID")}
                    </>
                  )}
                </p>
              </div>

              {/* Decorative Card Numbers */}
              <div className="absolute bottom-6 right-6 font-mono text-white/5 text-sm font-bold tracking-widest pointer-events-none">
                **** **** **** {wallet.id.substring(0, 4)}
              </div>
            </GlassCard>
          ))}

          {wallets.length === 0 && (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-24 text-slate-500">
              <LayoutGrid size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold capitalize tracking-[0.2em] text-cyan-400/50">
                System Empty
              </p>
              <p className="text-xs capitalize mt-0 tracking-widest">
                Deploy your first financial node
              </p>
            </div>
          )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteWalletId}
        onOpenChange={(open) => !open && setConfirmDeleteWalletId(null)}
        title="Delete Wallet?"
        description="This will permanently delete this wallet and ALL transactions associated with it."
        onConfirm={handleDeleteWallet}
        loading={isPending}
        variant="danger"
      />

      <Dialog.Root open={!!editingWallet} onOpenChange={(open) => !open && setEditingWallet(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-70 animate-in zoom-in-95 focus:outline-none">
            <div className="mb-6">
              <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                Edit Wallet
              </Dialog.Title>
              <p className="text-blue-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                Update wallet details
              </p>
            </div>
            {editingWallet && (
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Wallet Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Main Bank"
                    value={editingWallet.name}
                    onChange={(e) =>
                      setEditingWallet({ ...editingWallet, name: e.target.value })
                    }
                    className="bg-slate-900/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 rounded-xl bg-slate-900/50 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                      value={editingWallet.type}
                      onChange={(e) =>
                        setEditingWallet({ ...editingWallet, type: e.target.value })
                      }
                    >
                      <option value="Bank" className="bg-slate-900">Bank</option>
                      <option value="E-Wallet" className="bg-slate-900">E-Wallet</option>
                      <option value="Cash" className="bg-slate-900">Cash</option>
                      <option value="Investment" className="bg-slate-900">Investment</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Color
                  </label>
                  <div className="flex gap-2.5 flex-wrap px-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditingWallet({ ...editingWallet, color: c })}
                        className={cn(
                          "h-8 w-8 rounded-full transition-all duration-300 relative cursor-pointer",
                          editingWallet.color === c
                            ? "scale-110 shadow-[0_0_15px_currentColor]"
                            : "opacity-50 hover:opacity-100 hover:scale-105"
                        )}
                        style={{ backgroundColor: c, color: c }}
                      >
                        {editingWallet.color === c && (
                          <span className="absolute inset-0 rounded-full border-2 border-white pointer-events-none"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-14 rounded-2xl mt-4 font-bold bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}

// ─── Wallet Detail View ────────────────────────────────────────────────────────

function WalletDetail({
  wallet,
  wallets,
  categories,
  onBack,
}: {
  wallet: Wallet & { currentBalance: number };
  wallets: (Wallet & { currentBalance: number })[];
  categories: Category[];
  onBack: () => void;
}) {
  const { isHidden } = usePrivacy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<{
    id: string;
    date: string;
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const handleDeleteTransaction = () => {
    if (!confirmDeleteId) return;
    const targetId = confirmDeleteId.id;
    const targetDate = confirmDeleteId.date;
    setConfirmDeleteId(null); // optimistic close
    
    startTransition(async () => {
      try {
        await deleteTransaction(targetId, targetDate);
        await new Promise((r) => setTimeout(r, 600));
        await fetchTransactions();
      } catch {
        console.error("Failed to delete transaction");
      }
    });
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const date = new Date(`${selectedMonth}-01`);
      const all = await getTransactions(date);
      // Filter: this wallet's outgoing/incoming + transfers involving this wallet
      setTransactions(
        all.filter(
          (t: Transaction) => t.walletId === wallet.id || t.toWalletId === wallet.id
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  return (
    <div className="space-y-6 lg:bg-slate-950/50 lg:backdrop-blur-xl lg:p-8 lg:rounded-[32px] lg:border lg:border-white/5 lg:shadow-2xl min-h-[500px] relative">

      {/* Sync Overlay */}
      {(loading || isPending) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-[32px]">
          <Loader2 className="animate-spin mb-3 text-blue-400/50" size={36} />
          <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">
            Syncing Ledger...
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 px-1 lg:px-0">
        <button
          onClick={onBack}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${wallet.color}20`,
                color: wallet.color,
              }}
            >
              <CreditCard size={16} />
            </div>
            <div>
              <h2 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter leading-none">
                {wallet.name}
              </h2>
              <p
                className="text-xs font-bold capitalize tracking-[0.2em] mt-0.5 transition-all"
                style={{ color: `${wallet.color}99` }}
              >
                {wallet.type} · {maskAmount(wallet.currentBalance, isHidden, wallet.currencySymbol + " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Add Transaction Button */}
        <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
          <Dialog.Trigger asChild>
            <button className="h-10 px-4 shrink-0 flex items-center justify-center gap-2 rounded-xl bg-linear-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer">
              <Plus size={18} />
              <span className="hidden lg:block font-bold tracking-widest text-xs capitalize">
                Add Record
              </span>
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
            <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-70 animate-in zoom-in-95 duration-300 overflow-y-auto focus:outline-none">
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
                defaultWalletId={wallet.id}
                hideWalletSelect
                onStartSubmit={() => {
                  setAddOpen(false);
                  setLoading(true);
                }}
                onSuccess={() => {
                  setTimeout(async () => {
                    await fetchTransactions();
                  }, 600);
                }}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Month Picker */}
      <div className="flex items-center gap-3 px-1 lg:px-0">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-900/50 border border-white/10 text-white text-xs rounded-xl px-4 py-2 h-10 focus:outline-none focus:border-blue-500/50 font-bold capitalize tracking-wider transition-colors cursor-pointer"
        />
        <span className="text-xs text-slate-500 font-bold tracking-widest">
          {transactions.length} transactions
        </span>
      </div>

      {/* Transaction List */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 min-h-[300px]">
        {transactions.length === 0 && !loading ? (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-24 text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4 border"
              style={{
                backgroundColor: `${wallet.color}10`,
                borderColor: `${wallet.color}20`,
                color: `${wallet.color}50`,
              }}
            >
              <CreditCard size={32} />
            </div>
            <p className="text-slate-400 font-bold tracking-widest capitalize text-sm">
              No transactions this month
            </p>
            <p className="text-slate-500 text-xs mt-2 max-w-xs">
              Tap &quot;Add Record&quot; to log your first entry for this
              wallet.
            </p>
          </div>
        ) : (
          transactions.map((t) => {
            // Determine if this is the "source" or "destination" wallet for transfers
            const isOutgoing = t.walletId === wallet.id;
            const isTransferIn =
              t.type === "TRANSFER" && t.toWalletId === wallet.id;
            const amountSign = t.type === "INCOME" || isTransferIn ? "+" : "-";
            const amountColor =
              t.type === "INCOME" || isTransferIn
                ? "text-green-400"
                : t.type === "TRANSFER"
                ? "text-purple-400"
                : "text-red-400";

            return (
              <GlassCard
                key={t.id}
                className="p-4 lg:p-5 flex items-center justify-between hover:bg-slate-800/80 transition-all duration-300 border-white/5 group bg-slate-900/40 relative shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-inner",
                      t.type === "INCOME" || isTransferIn
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : t.type === "TRANSFER"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {t.type === "INCOME" || isTransferIn ? (
                      <ArrowDownLeft size={22} />
                    ) : t.type === "TRANSFER" && isOutgoing ? (
                      <ArrowRightLeft size={22} />
                    ) : (
                      <ArrowUpRight size={22} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-black text-white tracking-tight group-hover:text-blue-300 transition-colors">
                      {t.type === "TRANSFER"
                        ? isTransferIn
                          ? `Transfer In`
                          : `Transfer Out`
                        : t.category}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {t.description ||
                        (t.type === "TRANSFER" ? "Inter-wallet transfer" : "—")}
                    </p>
                    <p className="text-[10px] text-slate-600 font-bold tracking-wider uppercase">
                      {format(parseISO(t.date), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p
                    className={cn(
                      "text-base lg:text-lg font-black tracking-tight",
                      amountColor
                    )}
                  >
                    {maskAmount(t.amount, isHidden, amountSign + wallet.currencySymbol + " ")}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingTransaction(t)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDeleteId({ id: t.id, date: t.date })
                      }
                      disabled={isPending}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog.Root
        open={!!editingTransaction}
        onOpenChange={(v) => !v && setEditingTransaction(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-70 animate-in zoom-in-95 duration-300 overflow-y-auto focus:outline-none">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                  Edit Record
                </Dialog.Title>
                <p className="text-blue-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                  Modify Entry
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
            {editingTransaction && (
              <TransactionForm
                wallets={wallets}
                categories={categories}
                defaultWalletId={wallet.id}
                hideWalletSelect
                initialData={editingTransaction}
                onStartSubmit={() => {
                  setEditingTransaction(null);
                  setLoading(true);
                }}
                onSuccess={() => {
                  setTimeout(() => {
                    startTransition(async () => {
                      await fetchTransactions();
                    });
                  }, 600);
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete Transaction?"
        description="Are you sure you want to delete this transaction?"
        onConfirm={handleDeleteTransaction}
        loading={isPending}
        variant="danger"
      />
    </div>
  );
}

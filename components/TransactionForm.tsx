"use client";

import React, { useState, useRef } from "react";
import { addTransaction, editTransaction } from "@/app/actions";
import { Wallet, Transaction, TransactionType, Category } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Calendar } from "lucide-react";

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  initialData?: Transaction;
  defaultWalletId?: string;
  hideWalletSelect?: boolean;
  onSuccess?: () => void;
  onStartSubmit?: () => void;
}

export function TransactionForm({
  wallets,
  categories = [],
  initialData,
  defaultWalletId,
  hideWalletSelect = false,
  onSuccess,
  onStartSubmit,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(
    initialData?.amount.toLocaleString("id-ID") || ""
  );
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: initialData?.amount || 0,
    type: initialData?.type || "EXPENSE",
    category: initialData?.category || "",
    description: initialData?.description || "",
    walletId: initialData?.walletId || defaultWalletId || wallets[0]?.id || "",
    toWalletId: initialData?.toWalletId || "",
    date: initialData?.date || "",
  });

  // Set date on client side only if not provided or hydrating form
  React.useEffect(() => {
    if (!initialData?.date) {
      setFormData((prev) => ({
        ...prev,
        date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [initialData]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numValue = parseInt(value) || 0;
    setFormData({ ...formData, amount: numValue });
    setDisplayAmount(numValue.toLocaleString("id-ID"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    onStartSubmit?.(); // optimistically close dialog
    setLoading(true);
    try {
      if (initialData?.id) {
        await editTransaction(initialData.id, initialData.date, {
          amount: formData.amount,
          type: formData.type as TransactionType,
          category: formData.category,
          description: formData.description,
          walletId: formData.walletId,
          toWalletId: formData.toWalletId,
          date: formData.date,
        });
      } else {
        await addTransaction({
          amount: formData.amount,
          type: formData.type as TransactionType,
          category: formData.category,
          description: formData.description,
          walletId: formData.walletId,
          toWalletId: formData.toWalletId,
          date: formData.date,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-white">
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        {["EXPENSE", "INCOME", "TRANSFER"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                type: type as TransactionType,
                // Reset category when type changes, as income categories != expense categories
                category: "",
              })
            }
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-xs font-bold transition-all ${
              formData.type === type
                ? type === "EXPENSE"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : type === "INCOME"
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                  : "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
          Amount (IDR)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold z-10 pointer-events-none">
            Rp
          </span>
          <Input
            type="text"
            required
            placeholder="0"
            value={displayAmount}
            onChange={handleAmountChange}
            className="pl-12 text-lg font-bold h-14"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {formData.type === "TRANSFER" ? (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
                From Wallet
              </label>
              <div className="relative">
                <select
                  className="w-full h-10 rounded-xl bg-black/20 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none"
                  value={formData.walletId}
                  onChange={(e) =>
                    setFormData({ ...formData, walletId: e.target.value })
                  }
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-gray-900">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
                To Wallet
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full h-10 rounded-xl bg-black/20 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none"
                  value={formData.toWalletId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, toWalletId: e.target.value })
                  }
                >
                  <option value="" disabled className="bg-gray-900">
                    Select...
                  </option>
                  {wallets
                    .filter((w) => w.id !== formData.walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id} className="bg-gray-900">
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
                Category
              </label>
              <select
                required
                className="w-full h-10 rounded-xl bg-black/20 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="" disabled className="bg-gray-900">
                  Select a category...
                </option>
                {categories
                  .filter(
                    (c) =>
                      c.type === formData.type && !c.name.startsWith("DELETED_")
                  )
                  .map((c) => (
                    <option key={c.id} value={c.name} className="bg-gray-900">
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            {!hideWalletSelect && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
                  Wallet
                </label>
                <select
                  className="w-full h-10 rounded-xl bg-black/20 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none"
                  value={formData.walletId}
                  onChange={(e) =>
                    setFormData({ ...formData, walletId: e.target.value })
                  }
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-gray-900">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
          Date
        </label>
        <div className="relative">
          <Input
            type="date"
            ref={dateInputRef}
            required
            onFocus={() => dateInputRef.current?.showPicker()}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full"
          />
          <Calendar
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-white/40 capitalize tracking-widest px-1">
          Note
        </label>
        <Input
          type="text"
          placeholder="What was this for?"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <Button
        type="submit"
        className="w-full h-14 rounded-2xl text-lg font-bold mt-4"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : "Confirm Transaction"}
      </Button>
    </form>
  );
}

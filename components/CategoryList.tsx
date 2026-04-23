"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Category } from "@/lib/types";
import { GlassCard } from "./ui/glass-card";
import { Plus, Tag, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { addCategory, deleteCategory, getCategories, editCategory } from "@/app/actions";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRefresh } from "./RefreshContext";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#64748b",
];

export function CategoryList() {
  const { refreshKey } = useRefresh();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "EXPENSE",
    color: COLORS[0],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const c = await getCategories();
        setCategories(c);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    
    startTransition(async () => {
      try {
        await addCategory({
          name: formData.name,
          type: formData.type as "INCOME" | "EXPENSE",
          color: formData.color,
        });
        setFormData({
          name: "",
          type: "EXPENSE",
          color: COLORS[0],
        });
        // small delay before fetching
        await new Promise(r => setTimeout(r, 600));
        const c = await getCategories();
        setCategories(c);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const targetId = editingCategory.id;
    const updateData = {
      name: editingCategory.name,
      type: editingCategory.type,
      color: editingCategory.color,
    };
    
    setEditingCategory(null);
    startTransition(async () => {
      try {
        await editCategory(targetId, updateData);
        await new Promise(r => setTimeout(r, 600));
        const c = await getCategories();
        setCategories(c);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const targetId = confirmDeleteId;
    setConfirmDeleteId(null); // optimistic close
    
    startTransition(async () => {
      try {
        await deleteCategory(targetId);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const incomeCategories = categories
    .filter((c) => c.type === "INCOME")
    .filter((c) => !c.name.startsWith("DELETED_"));
  const expenseCategories = categories
    .filter((c) => c.type === "EXPENSE")
    .filter((c) => !c.name.startsWith("DELETED_"));

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-400/50" size={36} />
          <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">Loading Categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:bg-slate-950/50 lg:backdrop-blur-xl lg:p-8 lg:rounded-[32px] lg:border lg:border-white/5 lg:shadow-2xl min-h-[500px] relative">

      <div className="flex justify-between items-center px-1 lg:px-0">
        <div>
          <h2 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter capitalize relative inline-block">
            Categories Profile
          </h2>
          <p className="text-xs text-cyan-400/50 font-bold capitalize tracking-[0.2em] mt-0">
            Transaction Classification Tags
          </p>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="h-12 lg:h-12 lg:px-6 w-12 lg:w-auto flex items-center justify-center lg:gap-2 rounded-xl bg-linear-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer group">
              <Plus size={20} />
              <span className="hidden lg:block font-bold tracking-widest text-xs capitalize">
                New Category
              </span>
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
            <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-70 animate-in zoom-in-95 focus:outline-none">
              <div className="mb-6">
                <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                  Deploy Tag
                </Dialog.Title>
                <p className="text-cyan-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                  Initialize new category
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Category Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Groceries"
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
                      <option value="EXPENSE" className="bg-slate-900">
                        Expense
                      </option>
                      <option value="INCOME" className="bg-slate-900">
                        Income
                      </option>
                    </select>
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
                          "h-8 w-8 rounded-full transition-all duration-300 relative cursor-pointer",
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
                  {isPending ? "Initializing..." : "Add Category"}
                </Button>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <ConfirmDialog
          open={!!confirmDeleteId}
          onOpenChange={(open) => !open && setConfirmDeleteId(null)}
          title="Delete Category?"
          description="Transactions using it will keep their text label."
          onConfirm={handleDelete}
          loading={isPending}
          variant="danger"
        />
      </div>

      {/* Sync Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-[32px]">
          <Loader2 className="animate-spin mb-3 text-blue-400/50" size={36} />
          <p className="text-xs capitalize font-bold tracking-[0.2em] text-blue-400/40">
            Syncing Vault...
          </p>
        </div>
      )}

      {categories.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-24 text-center border-white/5 border-dashed bg-slate-900/40">
          <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-cyan-400/50 border border-cyan-500/10">
            <LayoutGrid size={32} />
          </div>
          <p className="text-slate-400 font-bold tracking-widest capitalize text-sm">
            No categories defined yet
          </p>
          <p className="text-slate-500 text-xs mt-2 capitalize font-semibold max-w-xs">
            Start structuring your financial data by creating expense and income
            categories.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-8 lg:mt-6">
          {/* Expenses */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
              Expense Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {expenseCategories.map((c) => (
                <GlassCard
                  key={c.id}
                  className="p-4 relative group border-white/10 bg-slate-900/60 transition-transform hover:-translate-y-1 h-32 flex flex-col justify-between"
                >
                  {/* Holographic / Gradient Card Background */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20 bg-linear-to-br from-transparent to-current rounded-3xl"
                    style={{ color: c.color }}
                  />
                  <div className="flex justify-between items-start relative z-10 w-full">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shadow-inner relative"
                      style={{
                        backgroundColor: `${c.color}20`,
                        color: c.color,
                      }}
                    >
                      <Tag size={20} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(c);
                        }}
                        disabled={isPending}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-400/50 hover:text-blue-400 hover:bg-blue-400/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(c.id);
                        }}
                        disabled={isPending}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-none line-clamp-1">
                      {c.name}
                    </h3>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Income */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
              Income Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {incomeCategories.map((c) => (
                <GlassCard
                  key={c.id}
                  className="p-4 relative group border-white/10 bg-slate-900/60 transition-transform hover:-translate-y-1 h-32 flex flex-col justify-between"
                >
                  {/* Holographic / Gradient Card Background */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20 bg-linear-to-br from-transparent to-current rounded-3xl"
                    style={{ color: c.color }}
                  />
                  <div className="flex justify-between items-start relative z-10 w-full">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shadow-inner relative"
                      style={{
                        backgroundColor: `${c.color}20`,
                        color: c.color,
                      }}
                    >
                      <Tag size={20} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(c);
                        }}
                        disabled={isPending}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-400/50 hover:text-blue-400 hover:bg-blue-400/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(c.id);
                        }}
                        disabled={isPending}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-none line-clamp-1">
                      {c.name}
                    </h3>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog.Root open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-8 shadow-2xl z-70 animate-in zoom-in-95 focus:outline-none">
            <div className="mb-6">
              <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                Edit Category
              </Dialog.Title>
              <p className="text-cyan-400/60 text-xs capitalize font-bold tracking-widest mt-0">
                Update tag details
              </p>
            </div>
            {editingCategory && (
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Category Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Groceries"
                    className="bg-slate-900/50"
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 capitalize tracking-widest px-1">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-10 rounded-xl bg-slate-900/50 border border-white/10 px-3 text-sm text-white focus:outline-none appearance-none opacity-50 cursor-not-allowed"
                      value={editingCategory.type}
                      disabled
                    >
                      <option value="EXPENSE" className="bg-slate-900">Expense</option>
                      <option value="INCOME" className="bg-slate-900">Income</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500 px-1">Type cannot be changed after creation.</p>
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
                        onClick={() => setEditingCategory({ ...editingCategory, color: c })}
                        className={cn(
                          "h-8 w-8 rounded-full transition-all duration-300 relative cursor-pointer",
                          editingCategory.color === c
                            ? "scale-110 shadow-[0_0_15px_currentColor]"
                            : "opacity-50 hover:opacity-100 hover:scale-105"
                        )}
                        style={{ backgroundColor: c, color: c }}
                      >
                        {editingCategory.color === c && (
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

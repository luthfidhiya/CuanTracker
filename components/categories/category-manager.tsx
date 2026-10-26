"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRight, Plus, Tags } from "lucide-react";
import { createCategory, deleteCategory, updateCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { ColorPicker, PALETTE, Segmented } from "@/components/ui/choice";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { ColorDot, EmptyState } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import type { Category, CategoryType } from "@/lib/types";

const TYPE_LABEL: Record<CategoryType, string> = { EXPENSE: "Pengeluaran", INCOME: "Pemasukan" };

type Editing = { mode: "create"; type: CategoryType } | { mode: "edit"; category: Category };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<CategoryType>("EXPENSE");
  const [editing, setEditing] = useState<Editing | null>(null);
  const list = categories.filter((c) => c.type === tab).sort((a, b) => a.name.localeCompare(b.name, "id"));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Segmented
          label="Jenis kategori"
          value={tab}
          onChange={setTab}
          options={[
            { value: "EXPENSE", label: "Pengeluaran" },
            { value: "INCOME", label: "Pemasukan" },
          ]}
          className="w-full sm:w-72"
        />
        <Button variant="secondary" onClick={() => setEditing({ mode: "create", type: tab })}>
          <Plus className="size-4" />
          Kategori
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Tags />}
          title={`Belum ada kategori ${TYPE_LABEL[tab].toLowerCase()}`}
          description="Kategori dipakai untuk mengelompokkan transaksi di analitik."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-(--radius-card) border border-border bg-surface">
          {list.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setEditing({ mode: "edit", category: c })}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-2"
              >
                <ColorDot color={c.color} />
                <span className="flex-1 truncate">{c.name}</span>
                <ChevronRight className="size-4 text-subtle" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.mode === "edit" ? "Ubah kategori" : "Kategori baru"}
        description={
          editing ? TYPE_LABEL[editing.mode === "edit" ? editing.category.type : editing.type] : undefined
        }
      >
        {editing && (
          <CategoryForm
            key={editing.mode === "edit" ? editing.category.id : editing.type}
            editing={editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function CategoryForm({ editing, onDone }: { editing: Editing; onDone: () => void }) {
  const initial = editing.mode === "edit" ? editing.category : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PALETTE[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startSaving(async () => {
      const result = initial
        ? await updateCategory(initial.id, { name, color })
        : await createCategory({ name, color, type: editing.mode === "create" ? editing.type : "EXPENSE" });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(initial ? "Kategori diperbarui" : "Kategori dibuat");
      onDone();
    });
  };

  const remove = () => {
    if (!initial) return;
    startDeleting(async () => {
      const result = await deleteCategory(initial.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmDelete(false);
      toast.success("Kategori dihapus");
      onDone();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-1">
      <Field label="Nama" htmlFor="category-name">
        <Input
          id="category-name"
          required
          maxLength={60}
          placeholder="Contoh: Makan, Transportasi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      {initial && (
        <p className="text-sm text-muted">
          Mengganti nama tidak mengubah transaksi lama; transaksi itu tetap memakai nama sebelumnya.
        </p>
      )}
      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>
      <div className="flex gap-2 pt-2">
        {initial && (
          <Button variant="secondary" className="text-danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
            Hapus
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" loading={saving} disabled={deleting}>
          {initial ? "Simpan perubahan" : "Buat kategori"}
        </Button>
      </div>

      {initial && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Hapus kategori ${initial.name}?`}
          description="Transaksi yang sudah memakai kategori ini tidak ikut terhapus dan tetap menampilkan namanya."
          onConfirm={remove}
          loading={deleting}
        />
      )}
    </form>
  );
}

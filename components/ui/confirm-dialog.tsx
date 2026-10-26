"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./button";

/**
 * Every destructive action asks through this dialog: what will be removed,
 * what else it affects, and an explicit action label instead of "OK".
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Hapus",
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-[60] bg-black/60" />
        <Dialog.Content
          role="alertdialog"
          className="dialog fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2
            rounded-2xl border border-border bg-surface p-5 focus:outline-none"
        >
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description asChild>
            <div className="mt-2 text-sm leading-relaxed text-muted">{description}</div>
          </Dialog.Description>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

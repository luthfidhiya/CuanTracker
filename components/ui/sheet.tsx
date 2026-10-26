"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * The one container for every form in the app: a bottom sheet on phones and a
 * centered dialog on larger screens.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="sheet fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface
            pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none
            sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2
            sm:rounded-2xl sm:border sm:pb-5"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-1 -mt-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Tutup"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="px-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

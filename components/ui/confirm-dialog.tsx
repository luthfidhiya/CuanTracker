"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-slate-950/90 border border-white/10 p-6 sm:p-8 shadow-2xl focus:outline-none z-[100] animate-in zoom-in-95 duration-300">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center border shadow-inner",
                variant === "danger"
                  ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : variant === "warning"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              )}
            >
              <AlertTriangle size={32} />
            </div>

            <div>
              <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-400 mt-2">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8">
            <button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-1 h-12 rounded-xl text-white font-medium transition-all shadow-[0_0_15px_currentColor] flex items-center justify-center",
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-500 text-white/90"
                  : variant === "warning"
                  ? "bg-yellow-600 hover:bg-yellow-500 text-white/90"
                  : "bg-blue-600 hover:bg-blue-500 text-white/90"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5 mx-auto" />
              ) : (
                "Confirm"
              )}
            </button>
          </div>
          
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import Link from "next/link";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ExternalLink, LogOut, Settings, Tags } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const item =
  "flex h-10 cursor-pointer select-none items-center gap-3 rounded-md px-3 text-sm outline-none " +
  "data-[highlighted]:bg-surface-2";

/**
 * Settings as a floating menu, so each thing has its own entry instead of
 * sharing one page. `trigger` decides how the button looks where it sits.
 */
export function SettingsMenu({
  spreadsheetUrl,
  variant,
}: {
  spreadsheetUrl?: string;
  /** `icon`: mobile header button; `row`: desktop sidebar row (menu opens upwards). */
  variant: "icon" | "row";
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Pengaturan"
        className={cn(
          "cursor-pointer text-muted outline-none transition-colors hover:bg-surface-2 hover:text-fg data-[state=open]:bg-surface-2 data-[state=open]:text-fg",
          variant === "icon"
            ? "grid size-10 place-items-center rounded-lg"
            : "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm"
        )}
      >
        <Settings className="size-[18px]" />
        {variant === "row" && "Pengaturan"}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          side={variant === "row" ? "top" : "bottom"}
          align={variant === "row" ? "start" : "end"}
          sideOffset={6}
          className="dialog z-40 min-w-56 rounded-xl border border-border bg-surface p-1 shadow-xl shadow-black/40"
        >
          <Menu.Label className="px-3 pb-1 pt-2 text-xs text-subtle">Pengaturan</Menu.Label>
          <Menu.Item asChild className={item}>
            <Link href="/categories">
              <Tags className="size-4 text-muted" />
              Kategori
            </Link>
          </Menu.Item>
          {spreadsheetUrl && (
            <Menu.Item asChild className={item}>
              <a href={spreadsheetUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4 text-muted" />
                Buka Google Sheets
              </a>
            </Menu.Item>
          )}
          <Menu.Separator className="my-1 h-px bg-border" />
          <Menu.Item className={cn(item, "text-danger")} onSelect={() => void signOutAction()}>
            <LogOut className="size-4" />
            Keluar
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

import { z } from "zod";
import { CURRENCIES } from "./currencies";
import { isIsoDate } from "./sheets/schema";
import { WALLET_TYPES } from "./wallet-types";

export { WALLET_TYPES };

const id = z.string().trim().min(1).max(64);
const name = z.string().trim().min(1, "Nama wajib diisi").max(60, "Nama maksimal 60 karakter");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid");
const isoDate = z.string().refine(isIsoDate, "Tanggal tidak valid");
const currencyCode = z.enum(CURRENCIES.map((c) => c.code) as [string, ...string[]]);

export const walletCreateSchema = z.object({
  name,
  type: z.enum(WALLET_TYPES),
  initialBalance: z.number().finite("Saldo awal tidak valid"),
  color,
  currencyCode,
});

export const walletUpdateSchema = z.object({
  name,
  type: z.enum(WALLET_TYPES),
  color,
});

export const categoryCreateSchema = z.object({
  name,
  type: z.enum(["INCOME", "EXPENSE"]),
  color,
});

export const categoryUpdateSchema = z.object({ name, color });

export const transactionSchema = z
  .object({
    date: isoDate,
    amount: z.number().finite().positive("Jumlah harus lebih dari 0"),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    category: z.string().trim().max(60).default(""),
    description: z.string().trim().max(200, "Catatan maksimal 200 karakter").default(""),
    walletId: id,
    toWalletId: z.string().trim().max(64).optional(),
  })
  .superRefine((t, ctx) => {
    if (t.type === "TRANSFER") {
      if (!t.toWalletId) {
        ctx.addIssue({ code: "custom", path: ["toWalletId"], message: "Pilih dompet tujuan" });
      } else if (t.toWalletId === t.walletId) {
        ctx.addIssue({ code: "custom", path: ["toWalletId"], message: "Dompet tujuan harus berbeda" });
      }
    } else if (!t.category) {
      ctx.addIssue({ code: "custom", path: ["category"], message: "Pilih kategori" });
    }
  })
  .transform((t) =>
    t.type === "TRANSFER"
      ? { ...t, category: "" }
      : { ...t, toWalletId: undefined }
  );

export const transactionRefSchema = z.object({ id, date: isoDate });
export const idSchema = id;

export type WalletCreateInput = z.input<typeof walletCreateSchema>;
export type WalletUpdateInput = z.input<typeof walletUpdateSchema>;
export type CategoryCreateInput = z.input<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.input<typeof categoryUpdateSchema>;
export type TransactionInput = z.input<typeof transactionSchema>;

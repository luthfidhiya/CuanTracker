import { ZodError } from "zod";
import { auth } from "@/auth";
import { UserError } from "@/lib/errors";
import { withWriteLock } from "@/lib/sheets/client";
import { ensureSpreadsheetReady } from "@/lib/sheets/setup";

export type ActionResult = { ok: true } | { ok: false; error: string };

export class UnauthorizedError extends UserError {
  constructor() {
    super("Sesi berakhir. Silakan masuk lagi.");
  }
}

/**
 * Server actions are public POST endpoints, so each one checks the session
 * itself instead of relying on the proxy alone.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
}

function toMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Data tidak valid";
  if (error instanceof UserError) return error.message;
  return "Gagal menyimpan ke Google Sheets. Coba lagi.";
}

/** Auth check, then `write` under the write lock. Failures become a message for the UI. */
export async function runMutation(write: () => Promise<void>): Promise<ActionResult> {
  try {
    await requireAuth();
    await withWriteLock(async () => {
      await ensureSpreadsheetReady();
      await write();
    });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof UserError) && !(error instanceof ZodError)) {
      console.error("[action] write failed:", error);
    }
    return { ok: false, error: toMessage(error) };
  }
}

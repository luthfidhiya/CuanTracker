"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo, LogoIcon } from "@/components/ui/logo";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: "" });

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoIcon className="mb-4 size-16" />
          <h1>
            <Logo preload className="h-9" />
          </h1>
          <p className="mt-3 text-sm text-muted">Masukkan kata sandi untuk melanjutkan.</p>
        </div>

        <form action={formAction} className="space-y-4">
          <Field label="Kata sandi" htmlFor="password">
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              autoFocus
              aria-invalid={!!state.error || undefined}
              aria-describedby={state.error ? "login-error" : undefined}
              className="h-11"
            />
          </Field>
          {state.error && (
            <p id="login-error" role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={isPending}>
            Masuk
          </Button>
        </form>
      </div>
    </main>
  );
}

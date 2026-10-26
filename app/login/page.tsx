"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: "" });

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl">
          <Logo />
        </h1>
        <p className="mb-8 mt-1 text-sm text-muted">Masukkan kata sandi untuk melanjutkan.</p>

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

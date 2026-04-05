'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState = {
  error: '',
  timestamp: 0,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      {/* Premium Background Decor */}
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="absolute top-1/2 left-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/20 blur-[100px]" />

      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-blue-500/10 p-4 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Secure Vault</h1>
          <p className="text-sm text-slate-400">Masukkan kata sandi untuk mengakses CuanTracker</p>
        </div>

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="password"
              name="password"
              placeholder="••••••••••••"
              required
              className="h-12 bg-black/20 text-center text-lg tracking-[0.3em] border-white/10 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 transition-all font-mono"
            />
            {state?.error && (
              <p className="text-sm text-rose-400 text-center animate-in fade-in slide-in-from-top-1" key={state.timestamp}>
                {state.error}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
          >
            {isPending ? 'Membuka...' : 'Buka Kunci'}
            {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

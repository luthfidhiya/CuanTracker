'use server';

import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    const password = formData.get('password') as string;
    await signIn('credentials', { password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Kata sandi tidak sesuai!', timestamp: Date.now() };
        default:
          return { error: 'Gagal login: Terjadi kesalahan!', timestamp: Date.now() };
      }
    }
    throw error;
  }

  redirect('/');
}

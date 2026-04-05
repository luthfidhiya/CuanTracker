'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  const expectedPwd = process.env.APP_PASSWORD;

  if (password === expectedPwd) {
    const cookieStore = await cookies();
    cookieStore.set('cuan_auth', 'authenticated', {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'strict',
    });
  } else {
    // Return error if mismatch. Adding timestamp just to force re-render/animation if user submits same wrong pwd twice.
    return { error: 'Kata sandi tidak sesuai!', timestamp: Date.now() };
  }

  redirect('/');
}

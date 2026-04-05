import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const expectedPwd = process.env.APP_PASSWORD;

  // Let pass if no password is set in env
  if (!expectedPwd) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isLoginPage = pathname.startsWith('/login');
  
  // Check cookie instead of Basic Auth header
  const authCookie = req.cookies.get('cuan_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|icon-.*|manifest.*).*)'],
};

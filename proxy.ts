export { auth as proxy } from "@/auth";

export const config = {
  // Icons, the logo and the manifest must load on the login page and for the home-screen install.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|icon|apple-icon|logo\\.png|manifest.*).*)'],
};

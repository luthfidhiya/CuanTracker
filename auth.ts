import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { password: {} },
      async authorize(credentials) {
        if (credentials?.password === process.env.APP_PASSWORD) {
          return { id: "1", name: "Owner" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");

      if (!isLoggedIn && !isLoginPage) {
        // NextAuth will redirect to the signIn page
        return false;
      }
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true; // Allow access
    },
  },
});

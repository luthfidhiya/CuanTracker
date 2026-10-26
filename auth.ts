import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { clientKey, loginLimiter, passwordMatches } from "@/lib/server/login-limit";

/** Too many wrong passwords; the login form tells this apart from a plain wrong password. */
export class LoginRateLimited extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { password: {} },
      async authorize(credentials, request) {
        const client = clientKey(request.headers);
        if (loginLimiter.retryAfter(client) > 0) throw new LoginRateLimited();

        // Without a configured password nobody can sign in.
        const expected = process.env.APP_PASSWORD;
        const given = typeof credentials?.password === "string" ? credentials.password : "";
        if (expected && passwordMatches(given, expected)) {
          loginLimiter.succeed(client);
          return { id: "1", name: "Owner" };
        }
        loginLimiter.fail(client);
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

import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.warn(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Add them to your environment.",
  );
}

// Fallback to avoid build errors if env vars are missing
const clientId = googleClientId || "dummy_client_id";
const clientSecret = googleClientSecret || "dummy_client_secret";

import User from "@/models/User";
import { connectDB } from "@/config/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: clientId,
      clientSecret: clientSecret,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) {
        return "/login?error=user-not-found";
      }

      await connectDB();
      const dbUser = await User.findOne({ email: user.email });
      console.log("DB User:", dbUser);

      if (!dbUser) {
        return "/login?error=user-not-found";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }

      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });

        if (dbUser) {
          token.role = dbUser.role;
          token.team_id = dbUser.team_id?.toString();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.team_id = token.team_id as string | undefined;
      }
      return session;
    },
  },
};

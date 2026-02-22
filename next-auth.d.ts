import NextAuth from "next-auth";

type Role = "team" | "judge" | "admin";

declare module "next-auth" {
  interface User {
    role?: Role;
    team_id?: string;
  }

  interface Session {
    user?: {
      role?: Role;
      team_id?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    team_id?: string;
  }
}

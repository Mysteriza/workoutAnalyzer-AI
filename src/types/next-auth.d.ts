import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      stravaId: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      profile?: any;
    } & DefaultSession["user"];
  }

  interface User {
    stravaId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    stravaId?: string;
    accessToken?: string;
  }
}

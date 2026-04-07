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
      profile?: {
        age?: number;
        weight?: number;
        height?: number;
        restingHeartRate?: number;
        preferredActivity?: string;
        isConfigured?: boolean;
      };
    } & DefaultSession["user"];
  }

  interface User {
    stravaId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    profile?: {
      age?: number;
      weight?: number;
      height?: number;
      restingHeartRate?: number;
      preferredActivity?: string;
      isConfigured?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    stravaId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    profile?: {
      age?: number;
      weight?: number;
      height?: number;
      restingHeartRate?: number;
      preferredActivity?: string;
      isConfigured?: boolean;
    };
  }
}

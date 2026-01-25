import NextAuth from "next-auth";
import StravaProvider from "next-auth/providers/strava";
import dbConnect from "./db";
import User from "@/models/User";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read,activity:read_all,profile:read_all",
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;

      await dbConnect();

      try {
        const stravaId = account.providerAccountId;

        const existingUser = await User.findOne({ stravaId } as any);

        const userData = {
          name: user.name || undefined,
          email: user.email || undefined,
          image: user.image || undefined,
          stravaId: stravaId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };

        if (existingUser) {
          existingUser.accessToken = account.access_token;
          existingUser.refreshToken = account.refresh_token;
          existingUser.expiresAt = account.expires_at;
          await existingUser.save();
        } else {
          await User.create(userData);
        }

        return true;
      } catch (error) {
        console.error("Error saving user to DB:", error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.stravaId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        await dbConnect();
        const dbUser = await User.findOne({ stravaId: token.stravaId } as any);

        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.stravaId = dbUser.stravaId!;
          session.user.accessToken = dbUser.accessToken!;
          session.user.refreshToken = dbUser.refreshToken!;
          session.user.expiresAt = dbUser.expiresAt!;
          session.user.profile = dbUser.profile;
        }
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});

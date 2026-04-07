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

        const existingUser = await User.findOne({ stravaId });

        const userData = {
          name: user.name || undefined,
          email: user.email || undefined,
          image: user.image || undefined,
          stravaId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          profile: {
            age: profile.age as number | undefined,
            weight: profile.weight as number | undefined,
            height: profile.height as number | undefined,
            restingHeartRate: profile.resting_heart_rate as number | undefined,
          },
        };

        let savedUser;
        if (existingUser) {
          // Update existing user tokens
          await User.findByIdAndUpdate(existingUser._id, {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
          });
          savedUser = existingUser;
        } else {
          savedUser = await User.create(userData);
        }

        // Attach MongoDB _id to user object so jwt callback receives it
        user.id = savedUser._id.toString();
        return true;
      } catch (error) {
        console.error("Error saving user to DB:", error);
        return false;
      }
    },
    async jwt({ token, account, user, trigger, session }) {
      // On initial sign-in, store all user data in the JWT token
      if (account && user) {
        token.userId = user.id;
        token.stravaId = account.providerAccountId;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // On session update trigger (e.g., profile change), refresh from DB
      if (trigger === "update" && session?.profile) {
        token.profile = session.profile;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Read from JWT instead of DB — eliminates N+1 queries
        session.user.id = token.userId as string;
        session.user.stravaId = token.stravaId as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
        session.user.expiresAt = token.expiresAt as number;
        session.user.profile = token.profile as
          | typeof session.user.profile
          | undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});

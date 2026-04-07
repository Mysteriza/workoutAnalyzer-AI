"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";

export function SessionSync() {
  const { data: session } = useSession();
  const { setProfile, setTokens, tokens } = useUserStore();

  useEffect(() => {
    if (!session?.user) return;

    // Sync profile from session (MongoDB → localStorage) on every mount
    const { profile, accessToken, refreshToken, expiresAt, stravaId } =
      session.user;

    if (profile) {
      setProfile({
        age: profile.age ?? 25,
        weight: profile.weight ?? 70,
        height: profile.height ?? 170,
        restingHeartRate: profile.restingHeartRate ?? 60,
        preferredActivity: profile.preferredActivity,
        isConfigured: profile.isConfigured ?? false,
      });
    }

    // Sync tokens if not already set locally
    if (!tokens && accessToken && refreshToken && expiresAt) {
      console.log("[SessionSync] Syncing tokens from session...");
      setTokens({
        accessToken,
        refreshToken,
        expiresAt: Number(expiresAt),
        athleteId: Number(stravaId),
      });
    }
  }, [session, tokens, setProfile, setTokens]);

  return null;
}

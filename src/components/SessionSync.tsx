"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";

export function SessionSync() {
  const { data: session } = useSession();
  const { setTokens, tokens, setProfile } = useUserStore();

  useEffect(() => {
    if (session?.user && !tokens) {
      // @ts-ignore
      const { accessToken, refreshToken, expiresAt, stravaId, profile } = session.user;

      if (accessToken && refreshToken && expiresAt) {
        console.log("Syncing Cloud Session to Local Storage...");
        setTokens({
          accessToken,
          refreshToken,
          expiresAt: Number(expiresAt),
          athleteId: Number(stravaId),
        });
      }

      if (profile) {
        // @ts-ignore
        setProfile(profile);
      }
    }
  }, [session, tokens, setTokens, setProfile]);

  return null;
}

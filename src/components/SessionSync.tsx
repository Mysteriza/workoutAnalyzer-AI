"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";

export function SessionSync() {
  const { data: session, status } = useSession();
  const { setProfile, setConnected } = useUserStore();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setConnected(false);
      return;
    }

    // Sync profile from session (MongoDB → localStorage) on every mount
    const { profile } = session.user;

    setConnected(true);

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

  }, [session, status, setConnected, setProfile]);

  return null;
}

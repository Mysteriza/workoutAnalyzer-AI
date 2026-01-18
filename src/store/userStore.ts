import { create } from "zustand";
import { UserProfile, StravaTokens } from "@/types";
import {
  getUserProfile,
  setUserProfile as saveUserProfile,
  getStravaTokens,
  setStravaTokens as saveStravaTokens,
  clearStravaTokens,
  isTokenExpired,
} from "@/utils/storage";

interface UserState {
  profile: UserProfile | null;
  tokens: StravaTokens | null;
  isConnected: boolean;
  isLoading: boolean;
  
  initializeFromStorage: () => void;
  setProfile: (profile: UserProfile) => void;
  setTokens: (tokens: StravaTokens) => void;
  refreshTokens: () => Promise<boolean>;
  disconnect: () => void;
  getValidAccessToken: () => Promise<string | null>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  tokens: null,
  isConnected: false,
  isLoading: true,

  initializeFromStorage: () => {
    const profile = getUserProfile();
    const tokens = getStravaTokens();
    set({
      profile,
      tokens,
      isConnected: !!tokens,
      isLoading: false,
    });
  },

  setProfile: (profile: UserProfile) => {
    saveUserProfile(profile);
    set({ profile });
  },

  setTokens: (tokens: StravaTokens) => {
    saveStravaTokens(tokens);
    set({ tokens, isConnected: true });
  },

  refreshTokens: async () => {
    const { tokens } = get();
    if (!tokens) return false;

    try {
      const response = await fetch("/api/strava/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const newTokens: StravaTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athleteId: tokens.athleteId,
      };

      saveStravaTokens(newTokens);
      set({ tokens: newTokens });
      return true;
    } catch {
      return false;
    }
  },

  disconnect: () => {
    clearStravaTokens();
    set({ tokens: null, isConnected: false });
  },

  getValidAccessToken: async () => {
    const { tokens, refreshTokens } = get();
    if (!tokens) return null;

    if (isTokenExpired(tokens)) {
      const success = await refreshTokens();
      if (!success) return null;
      return get().tokens?.accessToken || null;
    }

    return tokens.accessToken;
  },
}));

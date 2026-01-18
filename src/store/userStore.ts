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
  userProfile: UserProfile; // Changed from nullable to always having defaults
  tokens: StravaTokens | null;
  isConnected: boolean;
  isLoading: boolean;
  
  initializeFromStorage: () => void;
  setProfile: (profile: UserProfile) => void;
  setTokens: (tokens: StravaTokens) => void;
  refreshTokens: () => Promise<boolean>;
  disconnectStrava: () => void;
  connectStrava: () => void;
  getValidAccessToken: () => Promise<string | null>;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 25,
  weight: 70,
  height: 170,
  restingHeartRate: 60,
};

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: DEFAULT_PROFILE,
  tokens: null,
  isConnected: false,
  isLoading: true,

  initializeFromStorage: () => {
    const storedProfile = getUserProfile();
    const tokens = getStravaTokens();
    set({
      userProfile: storedProfile || DEFAULT_PROFILE,
      tokens,
      isConnected: !!tokens,
      isLoading: false,
    });
  },

  setProfile: (profile: UserProfile) => {
    saveUserProfile(profile);
    set({ userProfile: profile });
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

  disconnectStrava: () => {
    clearStravaTokens();
    set({ tokens: null, isConnected: false });
  },

  connectStrava: () => {
    window.location.href = "/api/strava/auth";
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

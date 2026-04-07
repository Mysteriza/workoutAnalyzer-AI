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
  userProfile: UserProfile;
  tokens: StravaTokens | null;
  isConnected: boolean;
  isLoading: boolean;

  initializeFromStorage: () => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  setTokens: (tokens: StravaTokens) => void;
  refreshTokens: () => Promise<boolean>;
  disconnectStrava: () => void;
  connectStrava: () => void;
  getValidAccessToken: () => Promise<string | null>;
  isProfileConfigured: () => boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 25,
  weight: 70,
  height: 170,
  restingHeartRate: 60,
  isConfigured: false,
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

  setProfile: (profile: Partial<UserProfile>) => {
    const currentProfile = get().userProfile;
    const updatedProfile = { ...currentProfile, ...profile };

    // Mark as configured if meaningful values are set
    updatedProfile.isConfigured =
      (profile.age !== undefined && profile.age !== DEFAULT_PROFILE.age) ||
      (profile.weight !== undefined && profile.weight !== DEFAULT_PROFILE.weight) ||
      (profile.restingHeartRate !== undefined &&
        profile.restingHeartRate !== DEFAULT_PROFILE.restingHeartRate) ||
      currentProfile.isConfigured;

    saveUserProfile(updatedProfile);
    set({ userProfile: updatedProfile });
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

  isProfileConfigured: () => {
    return get().userProfile.isConfigured;
  },
}));

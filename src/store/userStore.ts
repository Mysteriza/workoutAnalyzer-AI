import { create } from "zustand";
import { UserProfile, StravaTokens } from "@/types";
import {
  getUserProfile,
  setUserProfile as saveUserProfile,
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
  setConnected: (isConnected: boolean) => void;
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
    set({
      userProfile: storedProfile || DEFAULT_PROFILE,
      tokens: null,
      isConnected: false,
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

  setConnected: (isConnected: boolean) => {
    if (isConnected) {
      clearStravaTokens();
    }
    set({ isConnected, tokens: null });
  },

  refreshTokens: async () => {
    try {
      const response = await fetch("/api/strava/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      return response.ok;
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
    const { isConnected, tokens, refreshTokens } = get();
    if (!isConnected) return null;
    if (!tokens) return "server-managed-token";

    if (isTokenExpired(tokens)) {
      const success = await refreshTokens();
      if (!success) return null;
      return "server-managed-token";
    }

    return "server-managed-token";
  },

  isProfileConfigured: () => {
    return get().userProfile.isConfigured;
  },
}));

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
  syncServerProfile: () => Promise<void>;
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
    const initialProfile = storedProfile || DEFAULT_PROFILE;

    set({
      userProfile: initialProfile,
      tokens: null,
      isConnected: false,
      isLoading: false,
    });

    // Sync profile from server if logged in (overrides localStorage)
    get().syncServerProfile();
  },

  syncServerProfile: async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) return;

      const data = await res.json();
      if (!data.profile) return;

      const serverProfile: Partial<UserProfile> = {};
      if (data.profile.age) serverProfile.age = data.profile.age;
      if (data.profile.weight) serverProfile.weight = data.profile.weight;
      if (data.profile.height) serverProfile.height = data.profile.height;
      if (data.profile.restingHeartRate) serverProfile.restingHeartRate = data.profile.restingHeartRate;
      if (data.profile.preferredActivity) serverProfile.preferredActivity = data.profile.preferredActivity;
      if (data.profile.isConfigured) serverProfile.isConfigured = true;

      const current = get().userProfile;
      const merged = { ...current, ...serverProfile };
      saveUserProfile(merged);
      set({ userProfile: merged });
    } catch {
      // Non-critical — localStorage fallback works
    }
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
    if (!isConnected) {
      clearStravaTokens();
    }
    set({ isConnected, tokens: isConnected ? get().tokens : null });
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

import { create } from "zustand";
import { getPacificDateKey } from "@/utils/date";

interface UsageState {
  geminiCount: number;
  groqCount: number;
  lastReset: string;
  isLoaded: boolean;
  geminiLimit: number;
  groqLimit: number;
  getUsage: (provider: "Gemini" | "Groq") => number;
  incrementUsage: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

export const useUsageStore = create<UsageState>()((set, get) => ({
  geminiCount: 0,
  groqCount: 0,
  lastReset: getPacificDateKey(),
  isLoaded: false,
  geminiLimit: 500,
  groqLimit: 300,

  getUsage: (provider: "Gemini" | "Groq") => {
    const state = get();
    const todayPacific = getPacificDateKey();

    if (state.lastReset !== todayPacific) {
      return 0;
    }
    return provider === "Groq" ? state.groqCount : state.geminiCount;
  },

  incrementUsage: async () => {
    // Just sync from server, logic is now server-side in /api/analyze
    const stored = get();
    await stored.loadFromCloud();
  },

  loadFromCloud: async () => {
    try {
      const response = await fetch("/api/usage", { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } });
      if (response.ok) {
        const data = await response.json();
        set({
          geminiCount: data.geminiCount,
          groqCount: data.groqCount,
          lastReset: data.lastReset,
          geminiLimit: data.geminiLimit || 500,
          groqLimit: data.groqLimit || 300,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));

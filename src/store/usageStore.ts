import { create } from "zustand";

interface UsageState {
  count: number;
  lastReset: string;
  isLoaded: boolean;
  getUsage: () => number;
  setUsage: (count: number) => void;
  incrementUsage: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
  );
  return pacificTime.toISOString().split("T")[0];
}

export const useUsageStore = create<UsageState>()((set, get) => ({
  count: 0,
  lastReset: getPacificDateKey(),
  isLoaded: false,

  getUsage: () => {
    const state = get();
    const todayPacific = getPacificDateKey();

    if (state.lastReset !== todayPacific) {
      return 0;
    }
    return state.count;
  },

  setUsage: (count: number) => {
    set({ count, lastReset: getPacificDateKey() });
  },

  incrementUsage: async () => {
    // Just sync from server, logic is now server-side in /api/analyze
    const stored = get();
    await stored.loadFromCloud();
  },

  loadFromCloud: async () => {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        set({ count: data.count, lastReset: data.lastReset, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));

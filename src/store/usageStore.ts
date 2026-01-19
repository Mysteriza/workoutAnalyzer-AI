import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pacificTime.toISOString().split("T")[0];
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
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
        const todayPacific = getPacificDateKey();
        
        set((state) => ({
          count: state.lastReset === todayPacific ? state.count + 1 : 1,
          lastReset: todayPacific,
        }));

        try {
          const response = await fetch("/api/usage", { method: "POST" });
          if (response.ok) {
            const data = await response.json();
            set({ count: data.count, lastReset: data.lastReset });
          }
        } catch (error) {
          console.error("Failed to sync usage to cloud:", error);
        }
      },

      loadFromCloud: async () => {
        try {
          const response = await fetch("/api/usage");
          if (response.ok) {
            const data = await response.json();
            const todayPacific = getPacificDateKey();
            
            if (data.lastReset === todayPacific) {
              set({ count: data.count, lastReset: data.lastReset, isLoaded: true });
            } else {
              set({ count: 0, lastReset: todayPacific, isLoaded: true });
            }
          }
        } catch (error) {
          console.error("Failed to load usage from cloud:", error);
          set({ isLoaded: true });
        }
      },
    }),
    {
      name: "cardiokernel-usage",
    }
  )
);

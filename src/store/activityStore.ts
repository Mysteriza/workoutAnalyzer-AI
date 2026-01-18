import { create } from "zustand";
import { StravaActivity, ChartDataPoint, StreamData, ActivityDetail } from "@/types";
import { 
  getCachedActivities, 
  setCachedActivities, 
  hasCachedActivities,
  mergeActivities 
} from "@/utils/storage";

interface ActivityState {
  activities: StravaActivity[];
  selectedActivity: StravaActivity | null;
  activityDetail: ActivityDetail | null;
  streamData: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  
  fetchActivities: (accessToken: string) => Promise<void>;
  fetchActivityDetail: (activityId: number, accessToken: string) => Promise<void>;
  fetchStreams: (activityId: number, accessToken: string) => Promise<void>;
  setSelectedActivity: (activity: StravaActivity | null) => void;
  clearError: () => void;
  initializeFromCache: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  selectedActivity: null,
  activityDetail: null,
  streamData: [],
  isLoading: false,
  error: null,

  initializeFromCache: () => {
    const cached = getCachedActivities();
    if (cached.length > 0) {
      set({ activities: cached });
    }
  },

  fetchActivities: async (accessToken: string) => {
    if (!accessToken || typeof accessToken !== "string") {
      set({ error: "Invalid access token" });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch("/api/strava/activities?per_page=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch activities");
      }

      const fetchedActivities: StravaActivity[] = await response.json();
      
      if (!Array.isArray(fetchedActivities)) {
        throw new Error("Invalid response from Strava API");
      }
      
      const cachedActivities = getCachedActivities();
      const mergedActivities = mergeActivities(cachedActivities, fetchedActivities);
      
      setCachedActivities(mergedActivities);
      set({ 
        activities: mergedActivities, 
        isLoading: false,
      });
    } catch (err) {
      const cached = getCachedActivities();
      set({
        error: err instanceof Error ? err.message : "Failed to fetch activities",
        isLoading: false,
        activities: cached.length > 0 ? cached : get().activities,
      });
    }
  },

  fetchActivityDetail: async (activityId: number, accessToken: string) => {
    if (!Number.isInteger(activityId) || activityId <= 0) {
      set({ error: "Invalid activity ID" });
      return;
    }
    
    if (!accessToken || typeof accessToken !== "string") {
      set({ error: "Invalid access token" });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/strava/streams/${activityId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch activity details");
      }

      const data: ActivityDetail = await response.json();
      
      if (!data || !data.activity) {
        throw new Error("Invalid response from Strava API");
      }
      
      const streams: StreamData = data.streams || { time: [], distance: [] };
      const chartData: ChartDataPoint[] = [];
      const timeData = streams.time || [];
      
      for (let i = 0; i < timeData.length; i++) {
        chartData.push({
          time: timeData[i],
          distance: streams.distance?.[i] || 0,
          heartrate: streams.heartrate?.[i],
          speed: streams.velocity_smooth?.[i],
          altitude: streams.altitude?.[i],
          cadence: streams.cadence?.[i],
          watts: streams.watts?.[i],
        });
      }

      set({ 
        activityDetail: data,
        streamData: chartData, 
        isLoading: false 
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch activity details",
        isLoading: false,
        streamData: [],
      });
    }
  },

  fetchStreams: async (activityId: number, accessToken: string) => {
    return get().fetchActivityDetail(activityId, accessToken);
  },

  setSelectedActivity: (activity: StravaActivity | null) => {
    set({ selectedActivity: activity });
  },

  clearError: () => {
    set({ error: null });
  },
}));

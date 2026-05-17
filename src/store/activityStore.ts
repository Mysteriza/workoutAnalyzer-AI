import { create } from "zustand";
import {
  StravaActivity,
  ChartDataPoint,
  StreamData,
  ActivityDetail,
} from "@/types";
import {
  getCachedActivities,
  setCachedActivities,
  hasCachedActivities,
  mergeActivities,
} from "@/utils/storage";
import { stravaFetch } from "@/utils/stravaFetch";

interface ActivityState {
  activities: StravaActivity[];
  selectedActivity: StravaActivity | null;
  activityDetail: ActivityDetail | null;
  streamData: ChartDataPoint[];
  streamCache: Map<number, { data: ChartDataPoint[]; detail: ActivityDetail }>;
  isFromCache: boolean;
  isLoading: boolean;
  error: string | null;

  fetchActivities: () => Promise<void>;
  fetchActivityDetail: (
    activityId: number,
  ) => Promise<void>;
  setSelectedActivity: (activity: StravaActivity | null) => void;
  clearError: () => void;
  initializeFromCache: () => void;
  clearStreamCache: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  selectedActivity: null,
  activityDetail: null,
  streamData: [],
  streamCache: new Map(),
  isFromCache: false,
  isLoading: false,
  error: null,

  initializeFromCache: () => {
    const cached = getCachedActivities();
    if (cached.length > 0) {
      set({ activities: cached });
    }
  },

  fetchActivities: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await stravaFetch("/api/strava/activities?per_page=50");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch activities");
      }

      const fetchedActivities: StravaActivity[] = await response.json();

      if (!Array.isArray(fetchedActivities)) {
        throw new Error("Invalid response from Strava API");
      }

      const cachedActivities = getCachedActivities();
      const mergedActivities = mergeActivities(
        cachedActivities,
        fetchedActivities,
      );

      setCachedActivities(mergedActivities);
      set({
        activities: mergedActivities,
        isLoading: false,
      });
    } catch (err) {
      const cached = getCachedActivities();
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch activities",
        isLoading: false,
        activities: cached.length > 0 ? cached : get().activities,
      });
    }
  },

  fetchActivityDetail: async (activityId: number) => {
    if (!Number.isInteger(activityId) || activityId <= 0) {
      set({ error: "Invalid activity ID" });
      return;
    }

    const cached = get().streamCache.get(activityId);
    if (cached && cached.detail && cached.detail.activity && cached.detail.activity.id) {
      set({
        streamData: cached.data,
        activityDetail: cached.detail,
        isFromCache: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    const { getActivityDetailCache, saveActivityDetailCache } =
      await import("@/utils/storage");
    const storedCache = getActivityDetailCache(activityId);
    if (storedCache && storedCache.detail && storedCache.detail.activity && storedCache.detail.activity.id) {
      get().streamCache.set(activityId, storedCache);
      set({
        streamData: storedCache.data,
        activityDetail: storedCache.detail,
        isFromCache: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null, isFromCache: false });

    try {
      const response = await stravaFetch(`/api/strava/streams/${activityId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch activity details");
      }

      const data: ActivityDetail = await response.json();

      if (!data || !data.activity) {
        throw new Error("Invalid response from Strava API");
      }

      const streams: StreamData = data.streams || { time: [], distance: [] };

      // Set activity detail immediately so page renders, defer chart processing
      set({
        activityDetail: data,
        isFromCache: false,
        isLoading: false,
      });

      const streamData: StreamData = streams;
      const cacheObject = { data: [] as ChartDataPoint[], detail: data };

      const buildChartData = () => {
        const chartData: ChartDataPoint[] = [];
        const timeData = streamData.time || [];
        for (let i = 0; i < timeData.length; i++) {
          chartData.push({
            time: timeData[i],
            distance: streamData.distance?.[i] || 0,
            heartrate: streamData.heartrate?.[i],
            speed: streamData.velocity_smooth?.[i],
            altitude: streamData.altitude?.[i],
            cadence: streamData.cadence?.[i],
            watts: streamData.watts?.[i],
          });
        }
        cacheObject.data = chartData;
        get().streamCache.set(activityId, cacheObject);
        set({ streamData: chartData });
      };

      const saveCache = () => {
        try {
          saveActivityDetailCache(activityId, cacheObject);
        } catch {}
      };

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => {
          buildChartData();
          requestIdleCallback(() => saveCache(), { timeout: 2000 });
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          buildChartData();
          setTimeout(() => saveCache(), 50);
        }, 0);
      }
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch activity details",
        isLoading: false,
        streamData: [],
      });
    }
  },

  fetchStreams: async (activityId: number) => {
    return get().fetchActivityDetail(activityId);
  },

  setSelectedActivity: (activity: StravaActivity | null) => {
    set({ selectedActivity: activity });
  },

  clearError: () => {
    set({ error: null });
  },

  clearStreamCache: () => {
    set({ streamCache: new Map() });
  },
}));

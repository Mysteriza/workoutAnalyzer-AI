import {
  UserProfile,
  StravaTokens,
  SavedAnalysis,
  StravaActivity,
} from "@/types";

const USER_PROFILE_KEY = "workout_analyzer_user_profile";
const STRAVA_TOKENS_KEY = "workout_analyzer_strava_tokens";
const SAVED_ANALYSES_KEY = "workout_analyzer_saved_analyses";
const CACHED_ACTIVITIES_KEY = "workout_analyzer_cached_activities";
const ACTIVITIES_LAST_FETCH_KEY = "workout_analyzer_activities_last_fetch";
const ACTIVITY_DETAILS_CACHE_KEY = "workout_analyzer_activity_details_cache";

// ── In-memory caches (lazy init, avoid repeated JSON parse/stringify) ──
let _analysesCache: SavedAnalysis[] | null = null;
let _analysesDirty = false;
let _analysesWritePending: ReturnType<typeof setTimeout> | null = null;

let _detailCache: any[] | null = null;
let _detailCacheDirty = false;
let _detailCacheWritePending: ReturnType<typeof setTimeout> | null = null;

function loadAnalysesFromLS(): SavedAnalysis[] {
  if (_analysesCache) return _analysesCache;
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SAVED_ANALYSES_KEY);
  if (!stored) return [];
  try {
    _analysesCache = JSON.parse(stored) as SavedAnalysis[];
  } catch {
    _analysesCache = [];
  }
  return _analysesCache;
}

function flushAnalysesToLS(): void {
  if (!_analysesDirty || typeof window === "undefined") return;
  _analysesDirty = false;
  _analysesWritePending = null;
  localStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(_analysesCache || []));
}

function scheduleAnalysesFlush(): void {
  _analysesDirty = true;
  if (_analysesWritePending) return;
  _analysesWritePending = setTimeout(() => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => flushAnalysesToLS(), { timeout: 3000 });
    } else {
      flushAnalysesToLS();
    }
  }, 500);
}

function loadDetailCacheFromLS(): any[] {
  if (_detailCache) return _detailCache;
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(ACTIVITY_DETAILS_CACHE_KEY);
  if (!stored) return [];
  try {
    _detailCache = JSON.parse(stored) as any[];
  } catch {
    _detailCache = [];
  }
  return _detailCache;
}

function flushDetailCacheToLS(): void {
  if (!_detailCacheDirty || typeof window === "undefined") return;
  _detailCacheDirty = false;
  _detailCacheWritePending = null;
  localStorage.setItem(ACTIVITY_DETAILS_CACHE_KEY, JSON.stringify(_detailCache || []));
}

function scheduleDetailFlush(): void {
  _detailCacheDirty = true;
  if (_detailCacheWritePending) return;
  _detailCacheWritePending = setTimeout(() => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => flushDetailCacheToLS(), { timeout: 3000 });
    } else {
      flushDetailCacheToLS();
    }
  }, 500);
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_PROFILE_KEY);
  if (!stored) return null;
  try {
    const profile = JSON.parse(stored) as Partial<UserProfile>;
    return {
      age: profile.age ?? 25,
      weight: profile.weight ?? 70,
      height: profile.height ?? 170,
      restingHeartRate: profile.restingHeartRate ?? 60,
      preferredActivity: profile.preferredActivity,
      isConfigured: profile.isConfigured ?? false,
    } as UserProfile;
  } catch {
    return null;
  }
}

export function setUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_PROFILE_KEY);
}

export function getStravaTokens(): StravaTokens | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STRAVA_TOKENS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StravaTokens;
  } catch {
    return null;
  }
}

export function setStravaTokens(tokens: StravaTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STRAVA_TOKENS_KEY, JSON.stringify(tokens));
}

export function clearStravaTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STRAVA_TOKENS_KEY);
  localStorage.removeItem("strava_access_token");
  localStorage.removeItem("strava_refresh_token");
}

export function isTokenExpired(tokens: StravaTokens): boolean {
  return Date.now() / 1000 >= tokens.expiresAt - 300;
}

export function getSavedAnalysis(activityId: number): SavedAnalysis | null {
  if (typeof window === "undefined") return null;
  if (!Number.isInteger(activityId) || activityId <= 0) return null;
  const analyses = loadAnalysesFromLS();
  return analyses.find((a) => a.activityId === activityId) || null;
}

export function saveAnalysis(
  activityId: number, 
  content: string, 
  provider?: string, 
  aiModel?: string
): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(activityId) || activityId <= 0) return;
  if (!content || typeof content !== "string") return;

  const analyses = loadAnalysesFromLS();
  const existingIndex = analyses.findIndex((a) => a.activityId === activityId);
  const newAnalysis: SavedAnalysis = {
    activityId,
    content: content.substring(0, 50000),
    analyzedAt: new Date().toISOString(),
    provider,
    aiModel,
  };

  if (existingIndex >= 0) {
    analyses[existingIndex] = newAnalysis;
  } else {
    analyses.push(newAnalysis);
  }

  _analysesCache = analyses;
  if (analyses.length > 100) {
    _analysesCache = analyses.slice(-100);
  }
  scheduleAnalysesFlush();
}

export function deleteAnalysis(activityId: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(activityId) || activityId <= 0) return;

  const analyses = loadAnalysesFromLS();
  _analysesCache = analyses.filter((a) => a.activityId !== activityId);
  scheduleAnalysesFlush();
}

export function getAllSavedAnalyses(): SavedAnalysis[] {
  return loadAnalysesFromLS();
}

export function getCachedActivities(): StravaActivity[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CACHED_ACTIVITIES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as StravaActivity[];
  } catch {
    return [];
  }
}

export function setCachedActivities(activities: StravaActivity[]): void {
  if (typeof window === "undefined") return;
  if (!Array.isArray(activities)) return;

  const validActivities = activities.filter(
    (a) => a && typeof a.id === "number" && a.id > 0,
  );

  if (validActivities.length > 200) {
    validActivities.splice(200);
  }

  localStorage.setItem(CACHED_ACTIVITIES_KEY, JSON.stringify(validActivities));
  localStorage.setItem(ACTIVITIES_LAST_FETCH_KEY, new Date().toISOString());
}

export function getActivitiesLastFetch(): Date | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACTIVITIES_LAST_FETCH_KEY);
  if (!stored) return null;
  try {
    return new Date(stored);
  } catch {
    return null;
  }
}

export function hasCachedActivities(): boolean {
  return getCachedActivities().length > 0;
}

export function mergeActivities(
  cached: StravaActivity[],
  fetched: StravaActivity[],
): StravaActivity[] {
  const merged = new Map<number, StravaActivity>();

  for (const activity of cached) {
    if (activity && activity.id) {
      merged.set(activity.id, activity);
    }
  }

  for (const activity of fetched) {
    if (activity && activity.id) {
      merged.set(activity.id, activity);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  );
}

export function clearCachedActivities(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHED_ACTIVITIES_KEY);
  localStorage.removeItem(ACTIVITIES_LAST_FETCH_KEY);
}

export function getActivityDetailCache(activityId: number): any | null {
  if (typeof window === "undefined") return null;
  const cache = loadDetailCacheFromLS();
  const item = cache.find((i: any) => i.id === activityId);
  return item ? item.data : null;
}

const DETAIL_CACHE_MAX = 3;

export function saveActivityDetailCache(activityId: number, data: any): void {
  if (typeof window === "undefined") return;

  const cache = loadDetailCacheFromLS().filter((i: any) => i.id !== activityId);
  cache.unshift({ id: activityId, data, timestamp: Date.now() });

  _detailCache = cache;
  if (cache.length > DETAIL_CACHE_MAX) {
    _detailCache = cache.slice(0, DETAIL_CACHE_MAX);
  }

  try {
    scheduleDetailFlush();
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACTIVITY_DETAILS_CACHE_KEY);
        flushDetailCacheToLS();
      }
    }
  }
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(STRAVA_TOKENS_KEY);
  localStorage.removeItem(SAVED_ANALYSES_KEY);
  localStorage.removeItem(CACHED_ACTIVITIES_KEY);
  localStorage.removeItem(ACTIVITIES_LAST_FETCH_KEY);
  localStorage.removeItem(ACTIVITY_DETAILS_CACHE_KEY);
  localStorage.removeItem("strava_access_token");
  localStorage.removeItem("strava_refresh_token");
  _analysesCache = null;
  _detailCache = null;
}

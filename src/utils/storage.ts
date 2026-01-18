import { UserProfile, StravaTokens, SavedAnalysis, StravaActivity } from "@/types";

const USER_PROFILE_KEY = "workout_analyzer_user_profile";
const STRAVA_TOKENS_KEY = "workout_analyzer_strava_tokens";
const SAVED_ANALYSES_KEY = "workout_analyzer_saved_analyses";
const CACHED_ACTIVITIES_KEY = "workout_analyzer_cached_activities";
const ACTIVITIES_LAST_FETCH_KEY = "workout_analyzer_activities_last_fetch";

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_PROFILE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserProfile;
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
}

export function isTokenExpired(tokens: StravaTokens): boolean {
  return Date.now() / 1000 >= tokens.expiresAt - 300;
}

export function getSavedAnalysis(activityId: number): SavedAnalysis | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SAVED_ANALYSES_KEY);
  if (!stored) return null;
  try {
    const analyses: SavedAnalysis[] = JSON.parse(stored);
    return analyses.find(a => a.activityId === activityId) || null;
  } catch {
    return null;
  }
}

export function saveAnalysis(activityId: number, content: string): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(SAVED_ANALYSES_KEY);
  let analyses: SavedAnalysis[] = [];
  
  try {
    if (stored) {
      analyses = JSON.parse(stored);
    }
  } catch {
    analyses = [];
  }
  
  const existingIndex = analyses.findIndex(a => a.activityId === activityId);
  const newAnalysis: SavedAnalysis = {
    activityId,
    content,
    analyzedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    analyses[existingIndex] = newAnalysis;
  } else {
    analyses.push(newAnalysis);
  }
  
  localStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(analyses));
}

export function deleteAnalysis(activityId: number): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(SAVED_ANALYSES_KEY);
  if (!stored) return;
  
  try {
    let analyses: SavedAnalysis[] = JSON.parse(stored);
    analyses = analyses.filter(a => a.activityId !== activityId);
    localStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(analyses));
  } catch {
    return;
  }
}

export function getAllSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SAVED_ANALYSES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as SavedAnalysis[];
  } catch {
    return [];
  }
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
  localStorage.setItem(CACHED_ACTIVITIES_KEY, JSON.stringify(activities));
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

export function shouldRefreshActivities(): boolean {
  const lastFetch = getActivitiesLastFetch();
  if (!lastFetch) return true;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastFetch < fiveMinutesAgo;
}

export function mergeActivities(cached: StravaActivity[], fetched: StravaActivity[]): StravaActivity[] {
  const merged = new Map<number, StravaActivity>();
  
  cached.forEach(activity => {
    merged.set(activity.id, activity);
  });
  
  fetched.forEach(activity => {
    merged.set(activity.id, activity);
  });
  
  return Array.from(merged.values()).sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
}

export function clearCachedActivities(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHED_ACTIVITIES_KEY);
  localStorage.removeItem(ACTIVITIES_LAST_FETCH_KEY);
}

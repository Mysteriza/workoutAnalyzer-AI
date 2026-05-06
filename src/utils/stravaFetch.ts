/**
 * Client-side fetch wrapper for Strava API.
 * Automatically attaches the access token and handles 401 responses with token refresh.
 * Implements a refresh lock to prevent concurrent token refresh requests.
 */

let refreshPromise: Promise<boolean> | null = null;

/**
 * Deduplicated token refresh — only one refresh runs at a time.
 * All concurrent 401 handlers await the same promise.
 */
async function refreshServerToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshResponse = await fetch("/api/strava/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        clearTokens();
        return false;
      }

      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("strava_access_token");
  localStorage.removeItem("strava_refresh_token");
  localStorage.removeItem("workout_analyzer_strava_tokens");
  window.location.href = "/";
}

export async function stravaFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (typeof window === "undefined") {
    return new Response("stravaFetch is client-side only", { status: 500 });
  }

  const headers = new Headers(options.headers);

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await refreshServerToken();

    if (refreshed) {
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed — user is redirected in refreshServerToken
      return new Response("Token refresh failed", { status: 401 });
    }
  }

  return response;
}

/**
 * Client-side fetch wrapper for Strava API.
 * Automatically attaches the access token and handles 401 responses with token refresh.
 * Implements a refresh lock to prevent concurrent token refresh requests.
 */

let refreshPromise: Promise<string | null> | null = null;

/**
 * Deduplicated token refresh — only one refresh runs at a time.
 * All concurrent 401 handlers await the same promise.
 */
async function getFreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshResponse = await fetch("/api/strava/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          refresh_token: localStorage.getItem("strava_refresh_token"),
        }),
      });

      if (!refreshResponse.ok) {
        clearTokens();
        return null;
      }

      const { access_token, refresh_token, expires_at } =
        await refreshResponse.json();

      // Update localStorage with new tokens
      const tokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      };

      // Update the main token storage
      const existingTokens = localStorage.getItem("workout_analyzer_strava_tokens");
      let tokens = existingTokens ? JSON.parse(existingTokens) : {};
      tokens = { ...tokens, ...tokenData };
      localStorage.setItem("workout_analyzer_strava_tokens", JSON.stringify(tokens));

      // Also update the simple access token key for backward compatibility
      if (access_token) {
        localStorage.setItem("strava_access_token", access_token);
      }
      if (refresh_token) {
        localStorage.setItem("strava_refresh_token", refresh_token);
      }

      return access_token;
    } catch {
      clearTokens();
      return null;
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

  const getToken = (): string | null => {
    return localStorage.getItem("strava_access_token");
  };

  const currentToken = getToken();
  const headers = new Headers(options.headers);

  if (currentToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const freshToken = await getFreshToken();

    if (freshToken) {
      headers.set("Authorization", `Bearer ${freshToken}`);
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed — user is redirected in getFreshToken
      return new Response("Token refresh failed", { status: 401 });
    }
  }

  return response;
}

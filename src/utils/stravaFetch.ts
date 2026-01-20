export async function stravaFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("strava_access_token");
  };

  const currentToken = getToken();
  const headers = new Headers(options.headers);
  
  if (currentToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    try {
      const refreshResponse = await fetch("/api/strava/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const { accessToken } = await refreshResponse.json();
        
        if (typeof window !== "undefined" && accessToken) {
          localStorage.setItem("strava_access_token", accessToken);
        }

        headers.set("Authorization", `Bearer ${accessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("strava_access_token");
          window.location.href = "/";
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("strava_access_token");
        window.location.href = "/";
      }
    }
  }

  return response;
}

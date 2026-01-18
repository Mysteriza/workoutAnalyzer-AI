const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export function getStravaAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  
  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: `${baseUrl}/api/strava/callback`,
    response_type: "code",
    scope: "read,activity:read_all",
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatPace(speedMps: number): string {
  if (speedMps <= 0) return "--:--";
  const paceSecondsPerKm = 1000 / speedMps;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

export function formatSpeed(speedMps: number): string {
  const kmh = speedMps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: "🏃",
    Ride: "🚴",
    Swim: "🏊",
    Walk: "🚶",
    Hike: "🥾",
    WeightTraining: "🏋️",
    Workout: "💪",
    Yoga: "🧘",
  };
  return icons[type] || "🏅";
}

export { STRAVA_API_BASE };

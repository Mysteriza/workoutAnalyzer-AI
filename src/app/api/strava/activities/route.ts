import { NextRequest, NextResponse } from "next/server";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 }
    );
  }

  const accessToken = authHeader.replace("Bearer ", "");
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "30";

  try {
    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch activities" },
        { status: response.status }
      );
    }

    const activities = await response.json();
    return NextResponse.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    return NextResponse.json(
      { error: "Failed to fetch activities from Strava" },
      { status: 500 }
    );
  }
}

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  restingHeartRate: number;
}

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

export interface StravaGear {
  id: string;
  name: string;
  nickname?: string;
  primary: boolean;
  distance: number;
}

export interface StravaMap {
  id: string;
  polyline: string;
  summary_polyline: string;
}

export interface SegmentEffort {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  start_index: number;
  end_index: number;
  distance: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  average_cadence?: number;
  pr_rank?: number;
  achievements?: { type_id: number; type: string; rank: number }[];
  segment: {
    id: number;
    name: string;
    distance: number;
    average_grade: number;
    maximum_grade: number;
    elevation_high: number;
    elevation_low: number;
    climb_category: number;
  };
}

export interface Split {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  elevation_difference: number;
  average_speed: number;
  average_heartrate?: number;
  pace_zone?: number;
  split: number;
}

export interface Lap {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  lap_index: number;
  split: number;
  start_index: number;
  end_index: number;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  has_heartrate: boolean;
  kudos_count: number;
  average_cadence?: number;
  suffer_score?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  calories?: number;
  description?: string;
  achievement_count?: number;
  pr_count?: number;
  comment_count?: number;
  elev_high?: number;
  elev_low?: number;
  perceived_exertion?: number;
  workout_type?: number;
  gear?: StravaGear;
  gear_id?: string;
  map?: StravaMap;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  timezone?: string;
  photos?: { primary: unknown; count: number };
}

export interface ActivityDetail {
  activity: StravaActivity & {
    segment_efforts?: SegmentEffort[];
    splits_metric?: Split[];
    splits_standard?: Split[];
    laps?: Lap[];
    best_efforts?: unknown[];
  };
  streams: StreamData;
}

export interface StreamData {
  time: number[];
  distance: number[];
  heartrate?: number[];
  velocity_smooth?: number[];
  altitude?: number[];
  cadence?: number[];
  watts?: number[];
}

export interface ChartDataPoint {
  time: number;
  distance: number;
  heartrate?: number;
  speed?: number;
  altitude?: number;
  cadence?: number;
  watts?: number;
}

export interface AnalysisRequest {
  activity: StravaActivity;
  streamSample: ChartDataPoint[];
  userProfile: UserProfile;
}

export interface AnalysisResponse {
  content: string;
  error?: string;
}

export interface SavedAnalysis {
  activityId: number;
  content: string;
  analyzedAt: string;
}

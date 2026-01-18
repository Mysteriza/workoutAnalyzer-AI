"use client";

import Link from "next/link";
import { StravaActivity } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatDistance, formatDate, getActivityIcon } from "@/utils/strava";
import { Clock, MapPin, TrendingUp, Heart, Flame } from "lucide-react";

interface ActivityCardProps {
  activity: StravaActivity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <Link href={`/activity/${activity.id}`}>
      <Card className="glass hover:bg-white/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="text-2xl sm:text-3xl flex-shrink-0">{getActivityIcon(activity.type)}</div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm sm:text-base">
                  {activity.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {formatDate(activity.start_date_local)}
                </p>
              </div>
            </div>
            {activity.suffer_score && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium flex-shrink-0 ml-2">
                <Flame className="h-3 w-3" />
                {activity.suffer_score}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Jarak</p>
                <p className="font-medium text-sm sm:text-base truncate">{formatDistance(activity.distance)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Durasi</p>
                <p className="font-medium text-sm sm:text-base truncate">{formatDuration(activity.moving_time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Elevasi</p>
                <p className="font-medium text-sm sm:text-base truncate">{Math.round(activity.total_elevation_gain)} m</p>
              </div>
            </div>

            {activity.has_heartrate && activity.average_heartrate ? (
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Avg HR</p>
                  <p className="font-medium text-sm sm:text-base truncate">{Math.round(activity.average_heartrate)} bpm</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="font-medium text-sm sm:text-base truncate">{(activity.average_speed * 3.6).toFixed(1)} km/h</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { StravaActivity } from "@/types";
import { Card } from "@/components/ui/card";
import { formatDuration, formatDistance, formatDate, getActivityIcon } from "@/utils/strava";
import { MapPin, Clock, TrendingUp, Heart, Flame } from "lucide-react";

interface ActivityCardProps {
  activity: StravaActivity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const shortDate = new Date(activity.start_date_local).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/activity/${activity.id}`}>
      <Card className="glass hover:bg-white/10 hover:border-primary/50 transition-all duration-200 cursor-pointer group p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl flex-shrink-0">{getActivityIcon(activity.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate text-sm">
                {activity.name}
              </h3>
              {activity.suffer_score && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-medium flex-shrink-0">
                  <Flame className="h-2.5 w-2.5" />
                  {activity.suffer_score}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{shortDate}</p>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 text-blue-400" />
              <span className="font-medium text-foreground">{formatDistance(activity.distance)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3 text-green-400" />
              <span className="font-medium text-foreground">{formatDuration(activity.moving_time)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-yellow-400" />
              <span className="font-medium text-foreground">{Math.round(activity.total_elevation_gain)}m</span>
            </div>
            {activity.has_heartrate && activity.average_heartrate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Heart className="h-3 w-3 text-red-400" />
                <span className="font-medium text-foreground">{Math.round(activity.average_heartrate)}</span>
              </div>
            )}
          </div>

          <div className="flex sm:hidden items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{formatDistance(activity.distance)}</span>
            <span>•</span>
            <span className="font-medium text-foreground">{formatDuration(activity.moving_time)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

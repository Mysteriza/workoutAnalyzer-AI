"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { useActivityStore } from "@/store/activityStore";
import { ActivityChart } from "@/components/ActivityChart";
import { AIAnalysis } from "@/components/AIAnalysis";
import { SegmentList } from "@/components/SegmentList";
import { SplitsTable } from "@/components/SplitsTable";
import { ExportDataButton } from "@/components/ExportDataButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StravaActivity } from "@/types";
import {
  formatDuration,
  formatDistance,
  formatDate,
  formatSpeed,
  formatPace,
  getActivityIcon,
} from "@/utils/strava";
import {
  ArrowLeft,
  Clock,
  MapPin,
  TrendingUp,
  Heart,
  Gauge,
  Flame,
  Timer,
  Loader2,
  Zap,
  RotateCcw,
  ThumbsUp,
  Award,
  Mountain,
  Bike,
  FileText,
  ExternalLink,
} from "lucide-react";

interface ActivityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { id } = use(params);
  const { getValidAccessToken, isConnected, initializeFromStorage } = useUserStore();
  const { streamData, activityDetail, isLoading, isFromCache, fetchActivityDetail } = useActivityStore();
  const [activity, setActivity] = useState<StravaActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    const loadActivity = async () => {
      if (!isConnected) return;
      
      const token = await getValidAccessToken();
      if (!token) return;

      try {
        await fetchActivityDetail(parseInt(id), token);
      } catch (err) {
        console.error("Failed to load activity:", err);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadActivity();
  }, [id, isConnected, getValidAccessToken, fetchActivityDetail]);

  useEffect(() => {
    if (activityDetail?.activity) {
      setActivity(activityDetail.activity);
    }
  }, [activityDetail]);

  if (loadingActivity || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Activity Not Found</h1>
          <p className="text-muted-foreground">
            This activity could not be found or you don't have access.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stravaUrl = `https://www.strava.com/activities/${activity.id}`;

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
        <div className="flex gap-2">
          {activityDetail && (
            <ExportDataButton activityDetail={activityDetail} activityName={activity.name} />
          )}
          <a href={stravaUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Strava</span>
            </Button>
          </a>
        </div>
      </div>
      
      <Card className="glass mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">{getActivityIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{activity.name}</h1>
              <p className="text-muted-foreground text-sm">{formatDate(activity.start_date_local)}</p>
              {activity.gear && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Bike className="h-3 w-3" />
                  <span>{activity.gear.nickname || activity.gear.name}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {activity.suffer_score && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                  <Flame className="h-3 w-3" />
                  {activity.suffer_score}
                </div>
              )}
              {activity.pr_count && activity.pr_count > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                  <Award className="h-3 w-3" />
                  {activity.pr_count} PR
                </div>
              )}
            </div>
          </div>
          {activity.description && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-start gap-2">
                <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{activity.description}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <Card className="glass">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-blue-500/20 flex-shrink-0">
                <MapPin className="h-4 w-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-sm font-bold truncate">{formatDistance(activity.distance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-green-500/20 flex-shrink-0">
                <Clock className="h-4 w-4 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-bold truncate">{formatDuration(activity.moving_time)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-yellow-500/20 flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Elevation</p>
                <p className="text-sm font-bold truncate">{Math.round(activity.total_elevation_gain)} m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-cyan-500/20 flex-shrink-0">
                <Gauge className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-sm font-bold truncate">{formatSpeed(activity.average_speed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {activity.has_heartrate && activity.average_heartrate && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-red-500/20 flex-shrink-0">
                  <Heart className="h-4 w-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Avg HR</p>
                  <p className="text-sm font-bold truncate">{Math.round(activity.average_heartrate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.has_heartrate && activity.max_heartrate && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-red-600/20 flex-shrink-0">
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Max HR</p>
                  <p className="text-sm font-bold truncate">{Math.round(activity.max_heartrate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.average_watts && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-yellow-500/20 flex-shrink-0">
                  <Zap className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Power</p>
                  <p className="text-sm font-bold truncate">{Math.round(activity.average_watts)} W</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.average_cadence && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-indigo-500/20 flex-shrink-0">
                  <RotateCcw className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Cadence</p>
                  <p className="text-sm font-bold truncate">
                    {Math.round(activity.type === "Run" ? activity.average_cadence * 2 : activity.average_cadence)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.calories && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-rose-500/20 flex-shrink-0">
                  <Flame className="h-4 w-4 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="text-sm font-bold truncate">{Math.round(activity.calories)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.kilojoules && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-amber-500/20 flex-shrink-0">
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Energy</p>
                  <p className="text-sm font-bold truncate">{Math.round(activity.kilojoules)} kJ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(activity.elev_high || activity.elev_low) && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-emerald-500/20 flex-shrink-0">
                  <Mountain className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Elev Range</p>
                  <p className="text-sm font-bold truncate">
                    {Math.round(activity.elev_low || 0)}-{Math.round(activity.elev_high || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.max_speed && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-cyan-600/20 flex-shrink-0">
                  <Gauge className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Max Speed</p>
                  <p className="text-sm font-bold truncate">{formatSpeed(activity.max_speed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(activity.type === "Run" || activity.sport_type === "Run") && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-purple-500/20 flex-shrink-0">
                  <Timer className="h-4 w-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pace</p>
                  <p className="text-sm font-bold truncate">{formatPace(activity.average_speed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activity.kudos_count > 0 && (
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-orange-500/20 flex-shrink-0">
                  <ThumbsUp className="h-4 w-4 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Kudos</p>
                  <p className="text-sm font-bold truncate">{activity.kudos_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="chart" className="mb-4">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="chart" className="text-xs sm:text-sm py-2">Chart</TabsTrigger>
          <TabsTrigger value="segments" className="text-xs sm:text-sm py-2">Segments</TabsTrigger>
          <TabsTrigger value="splits" className="text-xs sm:text-sm py-2">Splits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-3">
          <ActivityChart data={streamData} title="Heart Rate & Speed" isFromCache={isFromCache} />
        </TabsContent>
        
        <TabsContent value="segments" className="mt-3">
          {activityDetail?.activity.segment_efforts && activityDetail.activity.segment_efforts.length > 0 ? (
            <SegmentList segments={activityDetail.activity.segment_efforts} />
          ) : (
            <Card className="glass">
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm">No segments in this activity</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="splits" className="mt-3">
          {activityDetail?.activity.splits_metric && activityDetail.activity.splits_metric.length > 0 ? (
            <SplitsTable splits={activityDetail.activity.splits_metric} type="metric" />
          ) : (
            <Card className="glass">
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm">No splits in this activity</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AIAnalysis activity={activity} streamData={streamData} />
    </div>
  );
}

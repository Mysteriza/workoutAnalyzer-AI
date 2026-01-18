"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { useActivityStore } from "@/store/activityStore";
import { ActivityCard } from "./ActivityCard";
import { Loader2, AlertCircle, Activity, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivitiesLastFetch } from "@/utils/storage";

export function ActivityList() {
  const { getValidAccessToken, isConnected } = useUserStore();
  const { activities, isLoading, error, fetchActivities, clearError, initializeFromCache } = useActivityStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  useEffect(() => {
    initializeFromCache();
    setLastFetch(getActivitiesLastFetch());
  }, [initializeFromCache]);

  const handleRefresh = useCallback(async () => {
    if (!isConnected || isRefreshing) return;
    setIsRefreshing(true);
    const token = await getValidAccessToken();
    if (token) {
      await fetchActivities(token);
      setLastFetch(new Date());
    }
    setIsRefreshing(false);
  }, [isConnected, isRefreshing, getValidAccessToken, fetchActivities]);

  const formatLastFetch = (date: Date | null) => {
    if (!date) return "Belum pernah";
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Memuat aktivitas...</p>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="p-4 rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-red-400 text-center px-4">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearError}>
            Tutup
          </Button>
          <Button onClick={handleRefresh}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Tidak ada aktivitas</p>
        <p className="text-sm text-muted-foreground text-center px-4">
          Klik Refresh untuk mengambil aktivitas dari Strava.
        </p>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh dari Strava
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{activities.length} aktivitas</span>
          {lastFetch && (
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatLastFetch(lastFetch)}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto text-red-400 hover:text-red-300">
            Tutup
          </Button>
        </div>
      )}
      <div className="grid gap-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

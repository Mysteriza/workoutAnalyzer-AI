"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useActivityStore } from "@/store/activityStore";
import { ActivityCard } from "./ActivityCard";
import { Loader2, AlertCircle, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActivityList() {
  const { getValidAccessToken, isConnected } = useUserStore();
  const { activities, isLoading, error, fetchActivities, clearError, initializeFromCache } = useActivityStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initializeFromCache();
  }, [initializeFromCache]);

  useEffect(() => {
    const loadActivities = async () => {
      if (!isConnected) return;
      const token = await getValidAccessToken();
      if (token) {
        fetchActivities(token);
      }
    };

    loadActivities();
  }, [isConnected, getValidAccessToken, fetchActivities]);

  const handleRefresh = async () => {
    if (!isConnected) return;
    setIsRefreshing(true);
    const token = await getValidAccessToken();
    if (token) {
      await fetchActivities(token, true);
    }
    setIsRefreshing(false);
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
        <Button variant="outline" onClick={clearError}>
          Tutup
        </Button>
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
          Mulai rekam aktivitas di Strava untuk melihatnya di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activities.length} aktivitas
        </p>
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
      <div className="grid gap-3 sm:gap-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

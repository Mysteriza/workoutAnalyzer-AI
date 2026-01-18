"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useUserStore } from "@/store/userStore";
import { useActivityStore } from "@/store/activityStore";
import { ActivityCard } from "./ActivityCard";
import { Loader2, AlertCircle, Activity, RefreshCw, Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActivitiesLastFetch } from "@/utils/storage";
import { StravaActivity } from "@/types";

type SortOption = "date_desc" | "date_asc" | "distance_desc" | "duration_desc";

export function ActivityList() {
  const { getValidAccessToken, isConnected } = useUserStore();
  const { activities, isLoading, error, fetchActivities, clearError, initializeFromCache } = useActivityStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  
  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const itemsPerPage = 15;

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

  // processedActivities: Sorted & Filtered
  const processedActivities = useMemo(() => {
    let sorted = [...activities];
    switch (sortBy) {
      case "date_desc":
        sorted.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        break;
      case "date_asc":
        sorted.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        break;
      case "distance_desc":
        sorted.sort((a, b) => b.distance - a.distance);
        break;
      case "duration_desc":
        sorted.sort((a, b) => b.moving_time - a.moving_time);
        break;
    }
    return sorted;
  }, [activities, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(processedActivities.length / itemsPerPage);
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedActivities.slice(start, start + itemsPerPage);
  }, [processedActivities, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Grouping Logic (Month Year)
  const groupedActivities = useMemo(() => {
    const groups: Record<string, StravaActivity[]> = {};
    paginatedActivities.forEach(activity => {
      const date = new Date(activity.start_date_local);
      const key = date.toLocaleString("id-ID", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });
    return groups;
  }, [paginatedActivities]);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg">
        <div className="space-y-1">
           <div className="flex items-center gap-2 text-sm font-medium">
             <span>Total: {activities.length} aktivitas</span>
           </div>
           {lastFetch && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Update: {formatLastFetch(lastFetch)}
            </div>
           )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Terbaru</SelectItem>
              <SelectItem value="date_asc">Terlama</SelectItem>
              <SelectItem value="distance_desc">Jarak Terjauh</SelectItem>
              <SelectItem value="duration_desc">Durasi Terlama</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex-1 sm:flex-none h-8 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([monthYear, groupActivities]) => (
          <div key={monthYear} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
              <Calendar className="h-4 w-4" />
              {monthYear}
            </h3>
            <div className="grid gap-3">
              {groupActivities.map((activity, index) => {
                 // Global index calculation logic can go here if needed, but simple numbering per page is easier or continuous
                 const globalIndex = activities.indexOf(activity) + 1;
                 return (
                   <div key={activity.id} className="relative">
                      {/* Optional: Add numbering badge if desired, though usually visual clutter on cards */}
                      <ActivityCard activity={activity} />
                   </div>
                 );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

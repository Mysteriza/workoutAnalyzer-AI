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
type ItemsPerPageOption = 10 | 15 | 20 | 25;

export function ActivityList() {
  const { getValidAccessToken, isConnected } = useUserStore();
  const { activities, isLoading, error, fetchActivities, clearError, initializeFromCache } = useActivityStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPageOption>(15);

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
    if (!date) return "Never";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const processedActivities = useMemo(() => {
    const sorted = [...activities];
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

  const totalPages = Math.ceil(processedActivities.length / itemsPerPage);
  
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedActivities.slice(start, start + itemsPerPage);
  }, [processedActivities, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value) as ItemsPerPageOption);
    setCurrentPage(1);
  };

  const groupedActivities = useMemo(() => {
    const groups: Record<string, StravaActivity[]> = {};
    paginatedActivities.forEach(activity => {
      const date = new Date(activity.start_date_local);
      const key = date.toLocaleString("en-US", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });
    return groups;
  }, [paginatedActivities]);

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading activities...</p>
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
          <Button variant="outline" onClick={clearError}>Close</Button>
          <Button onClick={handleRefresh}>Retry</Button>
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
        <p className="text-muted-foreground">No activities found</p>
        <p className="text-sm text-muted-foreground text-center px-4">
          Click Refresh to fetch activities from Strava.
        </p>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh from Strava
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-card/50 border border-border/50 p-2.5 rounded-lg">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium">{activities.length} activities</span>
          {lastFetch && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatLastFetch(lastFetch)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[120px] h-7 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="date_desc">Newest</SelectItem>
              <SelectItem value="date_asc">Oldest</SelectItem>
              <SelectItem value="distance_desc">Distance</SelectItem>
              <SelectItem value="duration_desc">Duration</SelectItem>
            </SelectContent>
          </Select>

          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[70px] h-7 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError} className="h-6 px-2 text-xs text-red-400 hover:text-red-300">
            Close
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedActivities).map(([monthYear, groupActivities]) => (
          <div key={monthYear} className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 sticky top-14 bg-background/95 backdrop-blur-sm py-1 z-10">
              <Calendar className="h-3 w-3" />
              {monthYear}
            </h3>
            <div className="space-y-1">
              {groupActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-7 w-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

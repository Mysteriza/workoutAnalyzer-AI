"use client";

import { ActivityDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportDataButtonProps {
  activityDetail: ActivityDetail;
  activityName: string;
}

export function ExportDataButton({ activityDetail, activityName }: ExportDataButtonProps) {
  const handleExport = () => {
    const activity = activityDetail.activity;
    const streams = activityDetail.streams;
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      activity: {
        id: activity.id,
        name: activity.name,
        type: activity.type,
        sport_type: activity.sport_type,
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        timezone: activity.timezone,
        description: activity.description,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        elev_high: activity.elev_high,
        elev_low: activity.elev_low,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        has_heartrate: activity.has_heartrate,
        average_cadence: activity.average_cadence,
        average_watts: activity.average_watts,
        max_watts: activity.max_watts,
        kilojoules: activity.kilojoules,
        calories: activity.calories,
        suffer_score: activity.suffer_score,
        achievement_count: activity.achievement_count,
        pr_count: activity.pr_count,
        kudos_count: activity.kudos_count,
        gear: activity.gear,
      },
      streams: {
        available: Object.keys(streams || {}),
        sampleSize: streams?.time?.length || 0,
      },
      segments: activity.segment_efforts?.map(seg => ({
        name: seg.name,
        distance: seg.distance,
        elapsed_time: seg.elapsed_time,
        moving_time: seg.moving_time,
        average_heartrate: seg.average_heartrate,
        max_heartrate: seg.max_heartrate,
        average_watts: seg.average_watts,
        pr_rank: seg.pr_rank,
        achievements: seg.achievements,
        segment: {
          name: seg.segment?.name,
          distance: seg.segment?.distance,
          average_grade: seg.segment?.average_grade,
          maximum_grade: seg.segment?.maximum_grade,
          elevation_high: seg.segment?.elevation_high,
          elevation_low: seg.segment?.elevation_low,
          climb_category: seg.segment?.climb_category,
        },
      })),
      splits_metric: activity.splits_metric,
      laps: activity.laps,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const safeName = activityName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `strava_${safeName}_${activity.id}.json`;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 sm:mr-1" />
      <span className="hidden sm:inline">Export</span>
    </Button>
  );
}

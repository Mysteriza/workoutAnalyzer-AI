"use client";

import { SegmentEffort } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/utils/strava";
import { Flag, TrendingUp, Award, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SegmentListProps {
  segments: SegmentEffort[];
}

export function SegmentList({ segments }: SegmentListProps) {
  const [expanded, setExpanded] = useState(false);
  const displaySegments = expanded ? segments : segments.slice(0, 5);

  if (!segments || segments.length === 0) return null;

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Flag className="h-5 w-5 text-orange-400" />
          Segments ({segments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 pt-0">
        <div className="space-y-2">
          {displaySegments.map((segment, index) => (
            <div
              key={segment.id || index}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">{segment.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {(segment.distance / 1000).toFixed(2)} km
                    {segment.segment?.average_grade !== undefined && (
                      <> &bull; {segment.segment.average_grade.toFixed(1)}% avg grade</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {segment.pr_rank && segment.pr_rank <= 3 && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      segment.pr_rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                      segment.pr_rank === 2 ? "bg-gray-400/20 text-gray-300" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>
                      PR #{segment.pr_rank}
                    </span>
                  )}
                  {segment.achievements && segment.achievements.length > 0 && (
                    <Award className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Waktu</span>
                  <p className="font-medium">{formatDuration(segment.elapsed_time)}</p>
                </div>
                {segment.average_heartrate && (
                  <div>
                    <span className="text-muted-foreground">Avg HR</span>
                    <p className="font-medium">{Math.round(segment.average_heartrate)} bpm</p>
                  </div>
                )}
                {segment.average_watts && (
                  <div>
                    <span className="text-muted-foreground">Power</span>
                    <p className="font-medium">{Math.round(segment.average_watts)} W</p>
                  </div>
                )}
                {segment.segment?.climb_category > 0 && (
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Cat
                    </span>
                    <p className="font-medium">Cat {segment.segment.climb_category}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {segments.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Tampilkan lebih sedikit
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Tampilkan {segments.length - 5} lagi
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

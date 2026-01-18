"use client";

import { Split } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/utils/strava";
import { LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SplitsTableProps {
  splits: Split[];
  type?: "metric" | "standard";
}

export function SplitsTable({ splits, type = "metric" }: SplitsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const displaySplits = expanded ? splits : splits.slice(0, 10);

  if (!splits || splits.length === 0) return null;

  const unit = type === "metric" ? "km" : "mi";

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <LayoutGrid className="h-5 w-5 text-blue-400" />
          Splits ({splits.length} {unit})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 pt-0 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-white/10">
              <th className="text-left py-2 px-2">{unit.toUpperCase()}</th>
              <th className="text-right py-2 px-2">Pace</th>
              <th className="text-right py-2 px-2">Waktu</th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">Elev</th>
              <th className="text-right py-2 px-2 hidden sm:table-cell">HR</th>
            </tr>
          </thead>
          <tbody>
            {displaySplits.map((split, index) => {
              const paceSecondsPerKm = split.distance > 0 
                ? split.moving_time / (split.distance / 1000) 
                : 0;
              const paceMin = Math.floor(paceSecondsPerKm / 60);
              const paceSec = Math.floor(paceSecondsPerKm % 60);
              
              const avgPace = splits.reduce((sum, s) => {
                const p = s.distance > 0 ? s.moving_time / (s.distance / 1000) : 0;
                return sum + p;
              }, 0) / splits.length;
              
              const isFaster = paceSecondsPerKm < avgPace * 0.95;
              const isSlower = paceSecondsPerKm > avgPace * 1.05;
              
              return (
                <tr 
                  key={index} 
                  className={`border-b border-white/5 ${
                    isFaster ? "bg-green-500/10" : isSlower ? "bg-red-500/10" : ""
                  }`}
                >
                  <td className="py-2 px-2 font-medium">{split.split || index + 1}</td>
                  <td className={`text-right py-2 px-2 font-mono ${
                    isFaster ? "text-green-400" : isSlower ? "text-red-400" : ""
                  }`}>
                    {paceMin}:{paceSec.toString().padStart(2, "0")}
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">
                    {formatDuration(split.moving_time)}
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground hidden sm:table-cell">
                    {split.elevation_difference > 0 ? "+" : ""}
                    {split.elevation_difference?.toFixed(0) || 0} m
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground hidden sm:table-cell">
                    {split.average_heartrate ? Math.round(split.average_heartrate) : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {splits.length > 10 && (
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
                Tampilkan {splits.length - 10} lagi
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

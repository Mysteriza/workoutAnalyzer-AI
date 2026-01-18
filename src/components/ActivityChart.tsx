"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface ActivityChartProps {
  data: ChartDataPoint[];
  title?: string;
}

interface ProcessedDataPoint {
  time: number;
  heartrate: number | null;
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hrValue = payload[0]?.value;

  return (
    <div className="bg-background/95 border border-border rounded-lg p-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium text-foreground mb-1">
        {formatTime(label as number)}
      </p>
      <p className="text-xs text-red-400">
        HR: {hrValue !== null && hrValue !== undefined ? `${hrValue} bpm` : "--"}
      </p>
    </div>
  );
}

export function ActivityChart({ data, title = "Heart Rate" }: ActivityChartProps) {
  const chartData = useMemo((): ProcessedDataPoint[] => {
    if (!data || data.length === 0) return [];
    
    const processed = data
      .filter(d => d.time !== undefined)
      .map(d => ({
        time: d.time,
        heartrate: d.heartrate && d.heartrate > 0 ? d.heartrate : null,
      }));
    
    if (processed.length <= 300) return processed;
    const step = Math.ceil(processed.length / 300);
    return processed.filter((_, index) => index % step === 0);
  }, [data]);

  const { hrMin, hrMax } = useMemo(() => {
    const hrs = chartData
      .map((d) => d.heartrate)
      .filter((h): h is number => h !== null && h > 0);

    if (hrs.length === 0) {
      return { hrMin: 60, hrMax: 200 };
    }

    return {
      hrMin: Math.max(40, Math.floor(Math.min(...hrs) - 10)),
      hrMax: Math.ceil(Math.max(...hrs) + 10),
    };
  }, [chartData]);

  const formatXAxis = (value: number) => {
    const hrs = Math.floor(value / 3600);
    const mins = Math.floor((value % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h${mins > 0 ? mins + "m" : ""}`;
    }
    return `${mins}m`;
  };

  const hasHeartRate = chartData.some((d) => d.heartrate !== null);
  const dataPointCount = chartData.length;

  if (dataPointCount === 0 || !hasHeartRate) {
    return (
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-red-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
          <Heart className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">
            Data heart rate tidak tersedia untuk aktivitas ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            {title}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {dataPointCount} data points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-48 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tick={{ fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[hrMin, hrMax]}
                stroke="#ef4444"
                fontSize={10}
                tick={{ fontSize: 10, fill: "#ef4444" }}
                tickFormatter={(v) => `${v}`}
                width={35}
                axisLine={{ stroke: "#ef4444", opacity: 0.5 }}
                tickLine={{ stroke: "#ef4444", opacity: 0.5 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="heartrate"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#hrGradient)"
                connectNulls
                dot={false}
                activeDot={{ r: 4, fill: "#ef4444" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

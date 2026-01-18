"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Gauge, Activity } from "lucide-react";

interface ActivityChartProps {
  data: ChartDataPoint[];
  title?: string;
}

interface ProcessedDataPoint {
  time: number;
  heartrate?: number;
  speed?: number;
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

  return (
    <div className="bg-background/95 border border-border rounded-lg p-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium text-foreground mb-1">
        {formatTime(label as number)}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : "--"}
          {entry.name === "Heart Rate" ? " bpm" : " km/h"}
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ data, title = "Data Aktivitas" }: ActivityChartProps) {
  const chartData = useMemo((): ProcessedDataPoint[] => {
    if (!data || data.length === 0) return [];
    
    const processed = data
      .filter(d => d.time !== undefined)
      .map(d => ({
        time: d.time,
        heartrate: d.heartrate && d.heartrate > 0 ? d.heartrate : undefined,
        speed: d.speed && d.speed > 0 ? d.speed * 3.6 : undefined,
      }));
    
    if (processed.length <= 300) return processed;
    const step = Math.ceil(processed.length / 300);
    return processed.filter((_, index) => index % step === 0);
  }, [data]);

  const { hrMin, hrMax, speedMin, speedMax } = useMemo(() => {
    const hrs = chartData.map((d) => d.heartrate).filter((h): h is number => h !== undefined && h > 0);
    const speeds = chartData.map((d) => d.speed).filter((s): s is number => s !== undefined && s > 0);

    return {
      hrMin: hrs.length > 0 ? Math.max(40, Math.floor(Math.min(...hrs) - 10)) : 60,
      hrMax: hrs.length > 0 ? Math.ceil(Math.max(...hrs) + 10) : 200,
      speedMin: 0,
      speedMax: speeds.length > 0 ? Math.ceil(Math.max(...speeds) + 5) : 50,
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

  const hasHeartRate = chartData.some((d) => d.heartrate !== undefined);
  const hasSpeed = chartData.some((d) => d.speed !== undefined);
  const dataPointCount = chartData.length;

  if (dataPointCount === 0 || (!hasHeartRate && !hasSpeed)) {
    return (
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
          <Activity className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">
            Data stream tidak tersedia untuk aktivitas ini
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
            <Activity className="h-4 w-4" />
            {title}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {dataPointCount} data points
          </span>
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground">
          {hasHeartRate && (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-400" />
              HR
            </span>
          )}
          {hasSpeed && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3 text-blue-400" />
              Speed
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: hasSpeed ? 40 : 5, left: hasHeartRate ? 0 : -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              />
              {hasHeartRate && (
                <YAxis
                  yAxisId="hr"
                  domain={[hrMin, hrMax]}
                  stroke="#ef4444"
                  fontSize={10}
                  tick={{ fontSize: 10, fill: "#ef4444" }}
                  tickFormatter={(v) => `${v}`}
                  orientation="left"
                  width={30}
                  axisLine={{ stroke: "#ef4444", opacity: 0.5 }}
                  tickLine={{ stroke: "#ef4444", opacity: 0.5 }}
                />
              )}
              {hasSpeed && (
                <YAxis
                  yAxisId="speed"
                  domain={[speedMin, speedMax]}
                  stroke="#3b82f6"
                  fontSize={10}
                  tick={{ fontSize: 10, fill: "#3b82f6" }}
                  tickFormatter={(v) => `${v}`}
                  orientation="right"
                  width={30}
                  axisLine={{ stroke: "#3b82f6", opacity: 0.5 }}
                  tickLine={{ stroke: "#3b82f6", opacity: 0.5 }}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconSize={8}
              />
              {hasHeartRate && (
                <>
                  <Area
                    yAxisId="hr"
                    type="monotone"
                    dataKey="heartrate"
                    stroke="transparent"
                    fill="url(#hrGradient)"
                    name="Heart Rate"
                    connectNulls
                  />
                  <Line
                    yAxisId="hr"
                    type="monotone"
                    dataKey="heartrate"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    dot={false}
                    name="Heart Rate"
                    connectNulls
                  />
                </>
              )}
              {hasSpeed && (
                <>
                  <Area
                    yAxisId="speed"
                    type="monotone"
                    dataKey="speed"
                    stroke="transparent"
                    fill="url(#speedGradient)"
                    name="Speed"
                    connectNulls
                  />
                  <Line
                    yAxisId="speed"
                    type="monotone"
                    dataKey="speed"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    name="Speed"
                    connectNulls
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

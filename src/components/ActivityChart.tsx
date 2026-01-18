"use client";

import { useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Gauge } from "lucide-react";

interface ActivityChartProps {
  data: ChartDataPoint[];
  title?: string;
}

interface ProcessedDataPoint {
  time: number;
  value: number | null;
}

function CustomTooltip({
  active,
  payload,
  label,
  metricLabel,
  unit,
}: TooltipProps<number, string> & { metricLabel: string; unit: string }) {
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

  const val = payload[0]?.value;

  return (
    <div className="bg-background/95 border border-border rounded-lg p-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium text-foreground mb-1">
        {formatTime(label as number)}
      </p>
      <p className="text-xs" style={{ color: payload[0].color }}>
        {metricLabel}: {val !== null && val !== undefined ? `${val.toFixed(1)} ${unit}` : "--"}
      </p>
    </div>
  );
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [metric, setMetric] = useState<"heartrate" | "speed">("heartrate");

  const { chartData, minValue, maxValue } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], minValue: 0, maxValue: 100 };

    const rawData = data
      .filter(d => d.time !== undefined)
      .map(d => {
        let val: number | null = null;
        if (metric === "heartrate") {
          val = d.heartrate && d.heartrate > 0 ? d.heartrate : null;
        } else {
          val = d.speed && d.speed > 0 ? d.speed * 3.6 : null; // Convert m/s to km/h
        }
        return {
          time: d.time,
          value: val,
        };
      });

    // Sampling for performance
    let processed = rawData;
    if (rawData.length > 500) {
      const step = Math.ceil(rawData.length / 500);
      processed = rawData.filter((_, index) => index % step === 0);
    }

    const values = processed
      .map(d => d.value)
      .filter((v): v is number => v !== null && v > 0);

    let min = 0;
    let max = 100;

    if (values.length > 0) {
      min = Math.floor(Math.min(...values) * 0.9);
      max = Math.ceil(Math.max(...values) * 1.1);
      
      // Enforce baseline for specific metrics
      if (metric === "heartrate") min = Math.max(40, min); 
      if (metric === "speed") min = 0;
    }

    return { chartData: processed, minValue: min, maxValue: max };
  }, [data, metric]);

  const formatXAxis = (value: number) => {
    const hrs = Math.floor(value / 3600);
    const mins = Math.floor((value % 3600) / 60);
    if (hrs > 0) return `${hrs}h${mins}m`;
    return `${mins}m`;
  };

  const hasData = chartData.some(d => d.value !== null);

  const color = metric === "heartrate" ? "#ef4444" : "#3b82f6";
  const Icon = metric === "heartrate" ? Heart : Gauge;
  const unit = metric === "heartrate" ? "bpm" : "km/h";
  const label = metric === "heartrate" ? "Heart Rate" : "Speed";

  if (!hasData) {
    return (
      <Card className="glass">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4" style={{ color }} />
            {label}
          </CardTitle> 
          <Select value={metric} onValueChange={(v) => setMetric(v as any)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heartrate">Heart Rate</SelectItem>
              <SelectItem value="speed">Speed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
          <Icon className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm text-center">
            Data {label.toLowerCase()} tidak tersedia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
           <CardTitle className="text-base flex items-center gap-2">
             <Icon className="h-4 w-4" style={{ color }} />
             {label}
           </CardTitle>
           <span className="text-xs font-normal text-muted-foreground hidden sm:inline-block">
            • {chartData.length} pts
           </span>
        </div>
        <Select value={metric} onValueChange={(v) => setMetric(v as any)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="heartrate">Heart Rate</SelectItem>
            <SelectItem value="speed">Speed</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-48 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
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
                minTickGap={30}
              />
              <YAxis
                domain={[minValue, maxValue]}
                stroke={color}
                fontSize={10}
                tick={{ fontSize: 10, fill: color }}
                tickFormatter={(v) => `${v}`}
                width={35}
                axisLine={{ stroke: color, opacity: 0.5 }}
                tickLine={{ stroke: color, opacity: 0.5 }}
              />
              <Tooltip 
                content={(props) => <CustomTooltip {...props} metricLabel={label} unit={unit} />} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
                connectNulls
                animationDuration={500}
                activeDot={{ r: 4, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

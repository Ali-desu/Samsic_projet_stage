"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export interface LineChartMetricConfig {
  key: string;
  label: string;
  color: string;
}

export interface DashboardLineChartProps {
  data: any[];
  metrics: LineChartMetricConfig[];
  xKey?: string;
}

export function DashboardLineChart({ data, metrics, xKey = "calculationDate" }: DashboardLineChartProps) {
  const [visibleMetrics, setVisibleMetrics] = React.useState(() => metrics.map(m => m.key));

  const handleToggle = (key: string) => {
    setVisibleMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Build ChartConfig for recharts theming
  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    metrics.forEach(m => {
      config[m.key] = { label: m.label, color: m.color };
    });
    return config;
  }, [metrics]);

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Ligne d'activité</CardTitle>
          <CardDescription>
            Affichage des métriques pour la famille sélectionnée
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 items-center px-6 py-2">
          {metrics.map((metric) => (
            <label key={metric.key} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleMetrics.includes(metric.key)}
                onChange={() => handleToggle(metric.key)}
              />
              <span style={{ color: metric.color }}>{metric.label}</span>
            </label>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            {metrics.filter(m => visibleMetrics.includes(m.key)).map((metric) => (
              <Line
                key={metric.key}
                dataKey={metric.key}
                type="monotone"
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

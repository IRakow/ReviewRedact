"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { useState } from "react"

interface RevenueChartProps {
  data: Array<{
    date: string
    total: number
    bts: number
    reseller: number
    salesperson: number
  }>
  period: "daily" | "weekly" | "monthly"
}

const COLORS = {
  total: "#6366f1",
  bts: "#8b5cf6",
  reseller: "#06b6d4",
  salesperson: "#10b981",
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-[#1a1a2e] px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
          <span className="font-mono font-semibold text-foreground">
            ${Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  const [chartType, setChartType] = useState<"line" | "area">("area")

  const Chart = chartType === "area" ? AreaChart : LineChart

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-md border border-border bg-surface-raised p-0.5">
          <button
            onClick={() => setChartType("area")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              chartType === "area"
                ? "bg-steel/20 text-steel"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              chartType === "line"
                ? "bg-steel/20 text-steel"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Line
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <Chart data={data}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.total} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.total} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.bts} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.bts} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReseller" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.reseller} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.reseller} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.salesperson} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.salesperson} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#888" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value: string) => (
              <span className="text-xs capitalize text-muted-foreground">{value}</span>
            )}
          />
          {chartType === "area" ? (
            <>
              <Area
                type="monotone"
                dataKey="total"
                stroke={COLORS.total}
                fill="url(#gradTotal)"
                strokeWidth={2}
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="bts"
                stroke={COLORS.bts}
                fill="url(#gradBts)"
                strokeWidth={2}
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="reseller"
                stroke={COLORS.reseller}
                fill="url(#gradReseller)"
                strokeWidth={2}
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="salesperson"
                stroke={COLORS.salesperson}
                fill="url(#gradSp)"
                strokeWidth={2}
                animationDuration={1200}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLORS.total}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="bts"
                stroke={COLORS.bts}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="reseller"
                stroke={COLORS.reseller}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="salesperson"
                stroke={COLORS.salesperson}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1200}
              />
            </>
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}

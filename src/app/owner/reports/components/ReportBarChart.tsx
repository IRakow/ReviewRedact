"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useRouter } from "next/navigation"

interface ReportBarChartProps {
  data: Array<{ name: string; value: number; id?: string }>
  color?: string
  href?: (id: string) => string
  layout?: "horizontal" | "vertical"
  valueFormatter?: (v: number) => string
}

const PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#f97316",
  "#a855f7",
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-[#1a1a2e] px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold text-foreground">
        ${Number(payload[0].value).toLocaleString()}
      </p>
    </div>
  )
}

export function ReportBarChart({
  data,
  color,
  href,
  layout = "vertical",
  valueFormatter,
}: ReportBarChartProps) {
  const router = useRouter()

  const handleClick = (entry: any) => {
    if (href && entry?.id) {
      router.push(href(entry.id))
    }
  }

  const fmt = valueFormatter ?? ((v: number) => `$${(v / 1000).toFixed(0)}k`)

  if (layout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={Math.max(data.length * 48, 200)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmt}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#ccc" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            animationDuration={1000}
            cursor={href ? "pointer" : "default"}
            onClick={(d: any) => handleClick(d)}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={color ?? PALETTE[i % PALETTE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
          cursor={href ? "pointer" : "default"}
          onClick={(d: any) => handleClick(d)}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={color ?? PALETTE[i % PALETTE.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

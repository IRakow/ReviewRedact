"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>
  centerLabel?: string
  centerValue?: string | number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-border bg-[#1a1a2e] px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: d.payload.color }}
        />
        <span className="text-xs text-foreground">{d.name}</span>
      </div>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">
        {d.value.toLocaleString()}
      </p>
    </div>
  )
}

function CustomLabel({ viewBox, centerLabel, centerValue }: any) {
  const { cx, cy } = viewBox
  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-2xl font-bold"
        style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 28, fontWeight: 700, fill: "#e5e5e5" }}
      >
        {centerValue}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 11, fill: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}
      >
        {centerLabel}
      </text>
    </g>
  )
}

export function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const displayValue = centerValue ?? total.toLocaleString()

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          animationDuration={1200}
          animationBegin={200}
          label={false}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="none" />
          ))}
          {centerLabel && (
            <CustomLabel centerLabel={centerLabel} centerValue={displayValue} />
          )}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

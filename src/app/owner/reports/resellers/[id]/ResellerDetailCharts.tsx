"use client"

import { useState, useEffect } from "react"
import { RevenueChart } from "../../components/RevenueChart"
import { ReportBarChart } from "../../components/ReportBarChart"
import { DonutChart } from "../../components/DonutChart"

interface Props {
  revenueTimeline: Array<{ date: string; total: number; bts: number; reseller: number; salesperson: number }>
  commissionSplitData: Array<{ name: string; value: number; color: string }>
  spBarData: Array<{ name: string; value: number; id?: string }>
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="noise-overlay relative overflow-hidden rounded-md border border-border bg-surface">
      <div className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-steel/40 to-transparent" />
      <div className="absolute top-0 left-0 h-16 w-px bg-gradient-to-b from-steel/40 to-transparent" />
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function ResellerDetailCharts({ revenueTimeline, commissionSplitData, spBarData }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-[400px] animate-pulse rounded-md border border-border bg-surface" />
  return (
    <div className="space-y-6">
      {/* Revenue over time */}
      <ChartCard title="Revenue Over Time" subtitle="Monthly revenue for this reseller">
        {revenueTimeline.length === 0 ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
            No revenue data yet
          </div>
        ) : (
          <RevenueChart data={revenueTimeline} period="monthly" />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Commission split donut */}
        <ChartCard title="Commission Split" subtitle="Revenue distribution breakdown">
          {commissionSplitData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              No paid invoices yet
            </div>
          ) : (
            <DonutChart
              data={commissionSplitData}
              centerLabel="Total"
              centerValue={`$${commissionSplitData.reduce((s, d) => s + d.value, 0).toLocaleString()}`}
            />
          )}
        </ChartCard>

        {/* Per-SP revenue bar chart */}
        <ChartCard title="Revenue by Salesperson" subtitle="Compare salesperson performance">
          {spBarData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              No salespeople data
            </div>
          ) : (
            <ReportBarChart data={spBarData} layout="horizontal" />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

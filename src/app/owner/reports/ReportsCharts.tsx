"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, PieChart as PieIcon, TrendingUp, Trophy } from "lucide-react"
import { RevenueChart } from "./components/RevenueChart"
import { ReportBarChart } from "./components/ReportBarChart"
import { DonutChart } from "./components/DonutChart"
import { TrendChart } from "./components/TrendChart"

interface Props {
  revenueTimeline: Array<{ date: string; total: number; bts: number; reseller: number; salesperson: number }>
  resellerBarData: Array<{ name: string; value: number; id?: string }>
  spBarData: Array<{ name: string; value: number; id?: string }>
  donutData: Array<{ name: string; value: number; color: string }>
  trendTimeline: Array<{ date: string; paid: number; sent: number; overdue: number }>
  topResellers: Array<{ name: string; value: number; id?: string }>
  topSalespeople: Array<{ name: string; value: number; id?: string }>
}

function ChartCard({
  title,
  subtitle,
  detailHref,
  children,
  className,
}: {
  title: string
  subtitle?: string
  detailHref?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`noise-overlay relative overflow-hidden rounded-md border border-border bg-surface transition-colors ${className ?? ""}`}
    >
      {/* Corner accent */}
      <div className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-steel/40 to-transparent" />
      <div className="absolute top-0 left-0 h-16 w-px bg-gradient-to-b from-steel/40 to-transparent" />

      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-1 text-xs text-steel hover:text-steel-light transition-colors"
          >
            View Details <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function ReportsCharts({
  revenueTimeline,
  resellerBarData,
  spBarData,
  donutData,
  trendTimeline,
  topResellers,
  topSalespeople,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Section A: Revenue Over Time */}
      <ChartCard
        title="Revenue Over Time"
        subtitle="Monthly revenue breakdown by category"
      >
        {revenueTimeline.length === 0 ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
            No revenue data yet
          </div>
        ) : (
          <RevenueChart data={revenueTimeline} period="monthly" />
        )}
      </ChartCard>

      {/* Section C + D: Revenue by Reseller & Salesperson */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Revenue by Reseller"
          subtitle="Total revenue generated per reseller"
          detailHref="/owner/reports/resellers"
        >
          {resellerBarData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No reseller data
            </div>
          ) : (
            <ReportBarChart
              data={resellerBarData}
              layout="horizontal"
              href={(id) => `/owner/reports/resellers/${id}`}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Revenue by Salesperson"
          subtitle="Top salespeople by generated revenue"
          detailHref="/owner/reports/salespeople"
        >
          {spBarData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No salesperson data
            </div>
          ) : (
            <ReportBarChart
              data={spBarData}
              layout="horizontal"
            />
          )}
        </ChartCard>
      </div>

      {/* Section E + F: Donut & Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Review Status Breakdown"
          subtitle="Distribution of all tracked reviews"
        >
          {donutData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              No review data
            </div>
          ) : (
            <DonutChart
              data={donutData}
              centerLabel="Reviews"
              centerValue={donutData.reduce((s, d) => s + d.value, 0).toLocaleString()}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Monthly Invoice Trends"
          subtitle="Invoices created per month by status"
        >
          {trendTimeline.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              No invoice data
            </div>
          ) : (
            <TrendChart
              data={trendTimeline}
              series={[
                { key: "paid", color: "#22c55e", label: "Paid" },
                { key: "sent", color: "#3b82f6", label: "Sent" },
                { key: "overdue", color: "#ef4444", label: "Overdue" },
              ]}
            />
          )}
        </ChartCard>
      </div>

      {/* Section G: Top Performers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top Resellers" subtitle="By total revenue">
          {topResellers.length === 0 ? (
            <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topResellers.map((r, i) => (
                <div key={r.id ?? r.name} className="flex items-center gap-4 py-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500/20 text-amber-400"
                        : i === 1
                          ? "bg-gray-400/20 text-gray-300"
                          : i === 2
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-surface-raised text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    {r.id ? (
                      <Link
                        href={`/owner/reports/resellers/${r.id}`}
                        className="text-sm font-medium text-foreground hover:text-steel transition-colors"
                      >
                        {r.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground">{r.name}</span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    ${r.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top Salespeople" subtitle="By total revenue">
          {topSalespeople.length === 0 ? (
            <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topSalespeople.map((sp, i) => (
                <div key={sp.id ?? sp.name} className="flex items-center gap-4 py-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500/20 text-amber-400"
                        : i === 1
                          ? "bg-gray-400/20 text-gray-300"
                          : i === 2
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-surface-raised text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{sp.name}</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    ${sp.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

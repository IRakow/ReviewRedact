"use client"

import { useTransition } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toggleResellerActive } from "@/app/admin/actions"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"

interface ResellerRow {
  id: string
  name: string
  company: string | null
  email: string
  client_count: number
  is_active: boolean
  created_at: string
}

interface ResellerTableProps {
  resellers: ResellerRow[]
}

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleResellerActive(id, !isActive)
    })
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleToggle()
      }}
      disabled={isPending}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/50",
        isActive ? "border-steel/30 bg-steel/20" : "border-border bg-surface",
        isPending && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-3.5 w-3.5 rounded-full shadow-sm transition-transform duration-200",
          isActive
            ? "translate-x-[18px] bg-steel"
            : "translate-x-[3px] bg-muted-foreground"
        )}
      />
    </button>
  )
}

export function ResellerTable({ resellers }: ResellerTableProps) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Name
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Company
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Email
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-widest text-muted-foreground text-center">
              Clients
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-widest text-muted-foreground text-center">
              Active
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Joined
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resellers.map((reseller) => (
            <TableRow
              key={reseller.id}
              className="group border-border/50 hover:bg-surface-raised cursor-pointer"
            >
              <TableCell>
                <Link
                  href={`/admin/resellers/${reseller.id}`}
                  className="text-sm font-medium text-foreground group-hover:text-steel-light transition-colors"
                >
                  {reseller.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {reseller.company || "\u2014"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {reseller.email}
              </TableCell>
              <TableCell className="text-center">
                <span className="font-mono text-sm text-muted-foreground">
                  {reseller.client_count}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <ActiveToggle id={reseller.id} isActive={reseller.is_active} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(reseller.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

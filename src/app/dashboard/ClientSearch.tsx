"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ClientCard } from "@/components/dashboard/ClientCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { Search, Users } from "lucide-react"

interface ClientData {
  id: string
  business_name: string
  owner_name: string
  address: string
  status: "pending" | "active" | "in_progress" | "completed" | "paused"
  review_count: number
  average_rating: number | null
}

interface ClientSearchProps {
  clients: ClientData[]
}

export function ClientSearch({ clients }: ClientSearchProps) {
  const [query, setQuery] = useState("")

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase()
    return (
      c.business_name.toLowerCase().includes(q) ||
      c.owner_name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients..."
          className="pl-9 bg-surface border-border"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={query ? "No clients match your search" : "No clients yet"}
          description={
            query
              ? "Try a different search term."
              : "Add your first client to start managing their reviews."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              id={client.id}
              businessName={client.business_name}
              ownerName={client.owner_name}
              address={client.address}
              status={client.status}
              reviewCount={client.review_count}
              averageRating={client.average_rating}
            />
          ))}
        </div>
      )}
    </>
  )
}

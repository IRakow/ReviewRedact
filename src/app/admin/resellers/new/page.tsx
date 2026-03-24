"use client"

import { ResellerForm } from "@/components/admin/ResellerForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewResellerPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-steel transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Admin
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Register Reseller
        </h1>
        <p className="text-xs text-muted-foreground">
          Create a new reseller account. A unique 6-digit PIN will be generated for login.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl rounded-md border border-border bg-surface p-6">
        <ResellerForm mode="create" />
      </div>
    </div>
  )
}

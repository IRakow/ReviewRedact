"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { resetSalespersonPinByReseller } from "./actions"

export function ResetSpPinButton({ spId, spName }: { spId: string; spName: string }) {
  const [resetting, setResetting] = useState(false)
  const [result, setResult] = useState("")

  async function handleReset() {
    if (!confirm(`Reset access code for ${spName}? A new code will be emailed to them.`)) return
    setResetting(true)
    setResult("")
    const res = await resetSalespersonPinByReseller(spId)
    if (res.error) {
      setResult(`Error: ${res.error}`)
    } else {
      setResult(`New: ${res.pin_code}`)
    }
    setResetting(false)
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={resetting}
        onClick={handleReset}
        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-30"
        title={`Reset PIN for ${spName}`}
      >
        <KeyRound className="h-3 w-3" />
        {resetting ? "..." : "Reset PIN"}
      </button>
      {result && (
        <span className={`text-[10px] font-mono ${result.startsWith("Error") ? "text-red-400" : "text-amber-400"}`}>
          {result}
        </span>
      )}
    </span>
  )
}

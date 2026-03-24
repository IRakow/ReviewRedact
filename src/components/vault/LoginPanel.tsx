"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export function LoginPanel({
  visible,
  className,
}: {
  visible: boolean
  className?: string
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 800)
    }
  }, [visible])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Access Denied")
        setShake(true)
        setTimeout(() => setShake(false), 600)
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch {
      setError("Connection failed")
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
          className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${className}`}
        >
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="pointer-events-auto"
          >
            <form
              onSubmit={handleSubmit}
              className="relative w-80 space-y-5 rounded-md border border-steel/20 bg-[#0a0a0a]/90 p-7 backdrop-blur-xl"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-steel/60 to-transparent" />
              <div className="absolute top-0 left-0 h-16 w-px bg-gradient-to-b from-steel/60 to-transparent" />
              <div className="absolute bottom-0 right-0 h-px w-16 bg-gradient-to-l from-steel/60 to-transparent" />
              <div className="absolute bottom-0 right-0 h-16 w-px bg-gradient-to-t from-steel/60 to-transparent" />

              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm border border-steel/30 bg-steel/5 font-mono text-sm font-bold text-steel">
                  RR
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Authorized Access
                </p>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Authorized User Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-border focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
                  placeholder="Enter name"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Code field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Access Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setCode(val)
                  }}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-lg tracking-[0.5em] text-center text-foreground placeholder:text-border placeholder:tracking-normal placeholder:text-sm focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center text-xs font-medium uppercase tracking-wider text-blood"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || name.length === 0 || code.length !== 6}
                className="w-full rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-steel/30 border-t-steel" />
                    Verifying
                  </span>
                ) : (
                  "Enter"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

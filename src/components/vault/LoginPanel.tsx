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
  const [showReset, setShowReset] = useState(false)
  const [resetName, setResetName] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

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

      // Hard navigation (not router.push) to avoid client-side cache issues
      if (!data.documents_signed && data.user_type !== "owner") {
        window.location.href = "/sign"
      } else if (data.user_type === "owner") {
        window.location.href = "/owner"
      } else {
        window.location.href = "/dashboard"
      }
    } catch {
      setError("Connection failed")
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage("")

    try {
      await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resetName.trim() }),
      })
      setResetMessage("If an account exists with that name, a new code has been emailed.")
    } catch {
      setResetMessage("If an account exists with that name, a new code has been emailed.")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
          className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4 ${className}`}
        >
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="pointer-events-auto"
          >
            <form
              onSubmit={handleSubmit}
              className="relative w-full max-w-80 space-y-5 rounded-md border border-[#c9a96e]/20 bg-[#0d0906]/90 p-7 backdrop-blur-xl"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 h-px w-16 bg-gradient-to-r from-[#c9a96e]/40 to-transparent" />
              <div className="absolute top-0 left-0 h-16 w-px bg-gradient-to-b from-[#c9a96e]/40 to-transparent" />
              <div className="absolute bottom-0 right-0 h-px w-16 bg-gradient-to-l from-[#c9a96e]/40 to-transparent" />
              <div className="absolute bottom-0 right-0 h-16 w-px bg-gradient-to-t from-[#c9a96e]/40 to-transparent" />

              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm border border-[#c9a96e]/30 bg-[#c9a96e]/5 font-mono text-sm font-bold text-[#c9a96e]">
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
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-border focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/30 transition-colors"
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
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-lg tracking-[0.5em] text-center text-foreground placeholder:text-border placeholder:tracking-normal placeholder:text-sm focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/30 transition-colors"
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
                className="w-full rounded-sm border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-4 py-3 min-h-[44px] text-xs font-semibold uppercase tracking-widest text-[#c9a96e] transition-all hover:bg-[#c9a96e]/20 hover:border-[#c9a96e]/50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#c9a96e]/30 border-t-[#c9a96e]" />
                    Verifying
                  </span>
                ) : (
                  "Enter"
                )}
              </button>

              {/* Forgot PIN link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setShowReset(!showReset); setResetMessage(""); setResetName("") }}
                  className="text-[10px] text-muted-foreground hover:text-[#c9a96e] transition-colors tracking-wide"
                >
                  Forgot your access code?
                </button>
              </div>
            </form>

            {/* Reset PIN form */}
            <AnimatePresence>
              {showReset && (
                <motion.form
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  onSubmit={handleResetSubmit}
                  className="w-full max-w-80 space-y-3 rounded-md border border-steel/20 bg-[#0a0a0a]/90 p-5 backdrop-blur-xl overflow-hidden"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground text-center">
                    Request Code Reset
                  </p>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={resetName}
                      onChange={(e) => setResetName(e.target.value)}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-border focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/30 transition-colors"
                      placeholder="Enter your name"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <AnimatePresence>
                    {resetMessage && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-[10px] font-medium tracking-wide text-emerald-400"
                      >
                        {resetMessage}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={resetLoading || resetName.trim().length === 0}
                    className="w-full rounded-sm border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#c9a96e] transition-all hover:bg-[#c9a96e]/20 hover:border-[#c9a96e]/50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#c9a96e]/30 border-t-[#c9a96e]" />
                        Sending
                      </span>
                    ) : (
                      "Request Reset"
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

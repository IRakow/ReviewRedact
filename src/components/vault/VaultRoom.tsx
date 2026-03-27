"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoginPanel } from "./LoginPanel"

// ─── Cinematic Speakeasy Landing — AI-Generated Photo Background ────────────

export function VaultRoom() {
  const [entered, setEntered] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleEnter = useCallback(() => {
    setEntered(true)
    setTimeout(() => setShowLogin(true), 1000)
  }, [])

  return (
    <div className="relative h-screen w-screen bg-[#080604] overflow-hidden select-none">
      {/* Speakeasy photo background */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img
          src="/speakeasy-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: entered
              ? "brightness(0.3) saturate(0.8)"
              : "brightness(0.55) saturate(0.9)",
            transition: "filter 1.5s ease-in-out",
          }}
        />
      </motion.div>

      {/* Warm color overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(8,6,4,0.3) 0%, rgba(8,6,4,0.1) 40%, rgba(8,6,4,0.4) 100%)",
        }}
      />

      {/* Heavy vignette for cinematic depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(8,6,4,0.6) 65%, rgba(8,6,4,0.9) 100%)",
        }}
      />

      {/* Top darkening */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(5,3,2,0.8) 0%, transparent 100%)",
        }}
      />

      {/* Bottom darkening */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(5,3,2,0.85) 0%, transparent 100%)",
        }}
      />

      {/* Film grain noise */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* RR Monogram + tagline */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm font-mono text-xl font-bold text-[#c9a96e]/70 tracking-wider"
              style={{
                border: "1px solid rgba(201,169,110,0.2)",
                background: "rgba(201,169,110,0.03)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 0 30px rgba(201,169,110,0.05)",
              }}
            >
              RR
            </div>
            <p className="text-[9px] font-medium uppercase tracking-[0.5em] text-[#c9a96e]/25">
              By Invitation Only
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Knock to enter" — the CTA */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 2 }}
          >
            <motion.button
              onClick={handleEnter}
              className="group relative px-8 py-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button background */}
              <div
                className="absolute inset-0 rounded-sm transition-all duration-500"
                style={{
                  border: "1px solid rgba(201,169,110,0.15)",
                  background: "rgba(201,169,110,0.03)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 0 20px rgba(201,169,110,0.03)",
                }}
              />
              <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  border: "1px solid rgba(201,169,110,0.3)",
                  background: "rgba(201,169,110,0.06)",
                  boxShadow: "0 0 30px rgba(201,169,110,0.08)",
                }}
              />
              <motion.span
                className="relative text-[10px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]/40 group-hover:text-[#c9a96e]/70 transition-colors duration-500"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Knock to enter
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen click area (also triggers enter) */}
      {!entered && (
        <div
          className="absolute inset-0 cursor-pointer z-[5]"
          onClick={handleEnter}
        />
      )}

      {/* Login panel */}
      <LoginPanel visible={showLogin} />
    </div>
  )
}

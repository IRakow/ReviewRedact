"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoginPanel } from "./LoginPanel"

// ─── Cinematic Speakeasy Landing ─────────────────────────────────────────────
// No 3D. Pure CSS/SVG with parallax layers, ambient animations, and atmosphere.

function AmberGlow({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: "radial-gradient(circle, rgba(212,165,116,0.15) 0%, rgba(212,165,116,0) 70%)",
      }}
      animate={{
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

function EdisonBulb({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
    >
      {/* Wire */}
      <div className="w-px h-8 bg-gradient-to-b from-[#333] to-[#c9a96e]/20 mx-auto" />
      {/* Bulb */}
      <motion.div
        className="w-3 h-4 rounded-full mx-auto"
        style={{
          background: "radial-gradient(ellipse, #ffb347 0%, #d4a574 40%, transparent 70%)",
          boxShadow: "0 0 20px 8px rgba(212,165,116,0.3), 0 0 60px 20px rgba(212,165,116,0.1)",
        }}
        animate={{
          opacity: [0.7, 1, 0.8, 1, 0.7],
          scale: [1, 1.05, 0.98, 1.02, 1],
        }}
        transition={{
          duration: 3,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}

function SpeakeasyScene({ onEnter, entered }: { onEnter: () => void; entered: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base — deep dark warm */}
      <div className="absolute inset-0 bg-[#08060 4]" />

      {/* Brick texture overlay (CSS pattern) */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #2a1a10 1px, transparent 1px),
            linear-gradient(to bottom, #2a1a10 1px, transparent 1px),
            linear-gradient(to right, rgba(60,30,15,0.3) 0px, transparent 0px)
          `,
          backgroundSize: "62px 26px, 62px 26px, 62px 26px",
        }}
      />

      {/* Vertical brick lines (more realistic) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 25px,
            #1a0e06 25px,
            #1a0e06 26px
          )`,
        }}
      />

      {/* Warm vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(8,6,4,0.7) 60%, rgba(8,6,4,0.95) 100%)",
        }}
      />

      {/* Top shadow (ceiling) */}
      <div
        className="absolute top-0 left-0 right-0 h-48"
        style={{
          background: "linear-gradient(to bottom, rgba(5,3,2,0.95) 0%, transparent 100%)",
        }}
      />

      {/* Bottom shadow (floor) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: "linear-gradient(to top, rgba(5,3,2,0.9) 0%, transparent 100%)",
        }}
      />

      {/* Edison bulbs */}
      <EdisonBulb x="15%" y="5%" delay={0} />
      <EdisonBulb x="38%" y="3%" delay={0.8} />
      <EdisonBulb x="62%" y="4%" delay={1.6} />
      <EdisonBulb x="85%" y="6%" delay={0.4} />
      <EdisonBulb x="25%" y="2%" delay={2.0} />
      <EdisonBulb x="75%" y="3%" delay={1.2} />

      {/* Amber glow pools (warm light on walls) */}
      <AmberGlow x="10%" y="10%" size={300} delay={0} />
      <AmberGlow x="70%" y="5%" size={350} delay={1} />
      <AmberGlow x="40%" y="60%" size={400} delay={2} />
      <AmberGlow x="80%" y="50%" size={280} delay={0.5} />

      {/* Bar counter silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-[35%]">
        {/* Bar surface */}
        <div
          className="absolute bottom-[25%] left-[5%] right-[5%] h-[3px]"
          style={{
            background: "linear-gradient(to right, transparent, #c9a96e40, #c9a96e60, #c9a96e40, transparent)",
          }}
        />
        {/* Bar front panel */}
        <div
          className="absolute bottom-0 left-[5%] right-[5%] h-[25%]"
          style={{
            background: "linear-gradient(to bottom, #1a0e0580, #0d070480)",
            borderTop: "1px solid rgba(201,169,110,0.1)",
          }}
        />
        {/* Bar stool silhouettes */}
        {[20, 35, 50, 65, 80].map((pos, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          >
            {/* Stool seat */}
            <div
              className="w-8 h-1 rounded-full absolute"
              style={{
                bottom: "26%",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(201,169,110,0.08)",
              }}
            />
            {/* Stool leg */}
            <div
              className="w-px absolute"
              style={{
                bottom: "0",
                height: "26%",
                left: "50%",
                background: "rgba(201,169,110,0.05)",
              }}
            />
          </div>
        ))}

        {/* Bottles silhouette on back bar */}
        <div className="absolute bottom-[26%] left-[10%] right-[10%] h-[50%] flex items-end justify-center gap-3 px-8">
          {[28, 35, 24, 32, 20, 38, 26, 30, 22, 34, 27, 36, 25, 31].map((h, i) => (
            <motion.div
              key={i}
              className="rounded-t-sm"
              style={{
                width: Math.random() > 0.5 ? 6 : 8,
                height: `${h}%`,
                background: `rgba(201,169,110,${0.03 + Math.random() * 0.04})`,
                flexShrink: 0,
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 5, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* Glass reflections / light streaks */}
      <motion.div
        className="absolute top-[20%] left-[30%] w-px h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(201,169,110,0.08), transparent)",
        }}
        animate={{ opacity: [0, 0.5, 0], y: [-20, 20] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[15%] right-[25%] w-px h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(201,169,110,0.06), transparent)",
        }}
        animate={{ opacity: [0, 0.4, 0], y: [-30, 10] }}
        transition={{ duration: 10, delay: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Speakeasy door frame (center, behind login) */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Door frame */}
            <div className="relative w-72 h-[420px]">
              {/* Frame border */}
              <div
                className="absolute inset-0 rounded-t-lg"
                style={{
                  border: "2px solid rgba(201,169,110,0.12)",
                  boxShadow: "inset 0 0 60px rgba(201,169,110,0.05), 0 0 80px rgba(201,169,110,0.03)",
                }}
              />
              {/* Door panels (decorative) */}
              <div
                className="absolute top-4 left-4 right-4 bottom-4 rounded-t-md"
                style={{
                  border: "1px solid rgba(201,169,110,0.06)",
                }}
              >
                {/* Upper panel */}
                <div
                  className="absolute top-3 left-3 right-3 h-[45%]"
                  style={{ border: "1px solid rgba(201,169,110,0.04)" }}
                />
                {/* Lower panel */}
                <div
                  className="absolute bottom-3 left-3 right-3 h-[35%]"
                  style={{ border: "1px solid rgba(201,169,110,0.04)" }}
                />
              </div>
              {/* Brass handle */}
              <motion.div
                className="absolute right-8 top-1/2 -translate-y-1/2 w-2 h-8 rounded-full cursor-pointer pointer-events-auto"
                style={{
                  background: "linear-gradient(to bottom, #c9a96e, #a8884e, #c9a96e)",
                  boxShadow: "0 0 10px rgba(201,169,110,0.3)",
                }}
                onClick={onEnter}
                whileHover={{ scale: 1.2, boxShadow: "0 0 20px rgba(201,169,110,0.5)" }}
                whileTap={{ scale: 0.95 }}
              />
              {/* Peephole */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-[22%] w-4 h-4 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.05) 50%, transparent 70%)",
                  border: "1px solid rgba(201,169,110,0.1)",
                }}
              />
              {/* Brass plate */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[30%] w-8 h-16 rounded-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(201,169,110,0.08), rgba(168,136,78,0.05))",
                  border: "1px solid rgba(201,169,110,0.08)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Noise overlay for film grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function VaultRoom() {
  const [entered, setEntered] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleEnter = useCallback(() => {
    setEntered(true)
    setTimeout(() => setShowLogin(true), 800)
  }, [])

  return (
    <div className="relative h-screen w-screen bg-[#080604] overflow-hidden select-none">
      <SpeakeasyScene onEnter={handleEnter} entered={entered} />

      {/* Title / RR monogram */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm border border-[#c9a96e]/20 bg-[#c9a96e]/5 font-mono text-xl font-bold text-[#c9a96e]/60 tracking-wider">
              RR
            </div>
            <p className="text-[9px] font-medium uppercase tracking-[0.5em] text-[#c9a96e]/20">
              By Invitation Only
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knock prompt */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            <motion.button
              onClick={handleEnter}
              className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]/25 hover:text-[#c9a96e]/50 transition-colors cursor-pointer"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Knock to enter
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login panel */}
      <LoginPanel visible={showLogin} />
    </div>
  )
}

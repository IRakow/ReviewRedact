"use client"

import { Suspense, useState, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"
import { BunkerEnvironment } from "./BunkerEnvironment"
import { VaultDoor } from "./VaultDoor"
import { LoginPanel } from "./LoginPanel"

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-steel/30 bg-steel/5 font-mono text-lg font-bold text-steel">
          RR
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-steel animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="h-1 w-1 rounded-full bg-steel animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="h-1 w-1 rounded-full bg-steel animate-pulse" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  )
}

export function VaultRoom() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    // Show login panel after door animation starts
    setTimeout(() => setShowLogin(true), 1500)
  }, [])

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden">
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: 3, // ACESFilmic
            toneMappingExposure: 0.8,
          }}
          style={{ cursor: isOpen ? "default" : "pointer" }}
        >
          <PerspectiveCamera
            makeDefault
            position={[0, 1.5, 3.5]}
            fov={50}
            near={0.1}
            far={50}
          />

          <fog attach="fog" args={["#0a0a0a", 3, 12]} />

          <BunkerEnvironment />
          <VaultDoor onOpen={handleOpen} isOpen={isOpen} />
        </Canvas>
      </Suspense>

      {/* Login panel overlay (HTML, not 3D) */}
      <LoginPanel visible={showLogin} />

      {/* Click hint (before vault is opened) */}
      {!isOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground/50">
            Click the vault to enter
          </p>
        </div>
      )}
    </div>
  )
}

"use client"

import { Suspense, useState, useCallback, useEffect, Component, type ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"
import { BunkerEnvironment } from "./BunkerEnvironment"
import { VaultDoor } from "./VaultDoor"
import { LoginPanel } from "./LoginPanel"

class ErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

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
  const [canvasReady, setCanvasReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setTimeout(() => setShowLogin(true), 1500)
  }, [])

  // Timeout — if canvas doesn't load in 8s, show login directly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasReady) {
        setLoadError("3D scene timed out")
        setShowLogin(true)
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [canvasReady])

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden">
      {!canvasReady && !loadError && <LoadingScreen />}

      <ErrorBoundary onError={(err) => {
        setLoadError(err.message)
        setShowLogin(true)
      }}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            powerPreference: "default",
          }}
          style={{ cursor: isOpen ? "default" : "pointer" }}
          onCreated={() => setCanvasReady(true)}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera
              makeDefault
              position={[0, 1.5, 3.5]}
              fov={50}
              near={0.1}
              far={50}
            />

            <fog attach="fog" args={["#0a0a0a", 6, 18]} />

            <BunkerEnvironment />
            <VaultDoor onOpen={handleOpen} isOpen={isOpen} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Login panel overlay */}
      <LoginPanel visible={showLogin} />

      {/* Click hint */}
      {canvasReady && !isOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground/50">
            Click the vault to enter
          </p>
        </div>
      )}

      {/* Debug info — remove later */}
      {loadError && (
        <div className="absolute top-4 left-4 text-[10px] text-red-500/50 font-mono">
          {loadError}
        </div>
      )}
    </div>
  )
}

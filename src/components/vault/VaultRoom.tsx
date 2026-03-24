"use client"

import { Suspense, useState, useCallback, useEffect, useRef, Component, type ReactNode } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
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

// Subtle camera drift for immersion
function CameraDrift() {
  const offset = useRef(new THREE.Vector3())

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()
    offset.current.x = Math.sin(t * 0.15) * 0.08
    offset.current.y = Math.sin(t * 0.12 + 1) * 0.04 + 1.5
    offset.current.z = 3.5 + Math.sin(t * 0.1) * 0.05

    camera.position.lerp(
      new THREE.Vector3(offset.current.x, offset.current.y, offset.current.z),
      0.02
    )
    camera.lookAt(0, 1.2, -2.8)
  })

  return null
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
    setTimeout(() => setShowLogin(true), 1800)
  }, [])

  // Timeout — if canvas doesn't load in 10s, show login directly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasReady) {
        setLoadError("3D scene timed out")
        setShowLogin(true)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [canvasReady])

  return (
    <div className="relative h-screen w-screen bg-[#050505] overflow-hidden">
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
            powerPreference: "high-performance",
            alpha: false,
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.0
            setCanvasReady(true)
          }}
        >
          <Suspense fallback={null}>
            <CameraDrift />

            <fog attach="fog" args={["#050505", 5, 16]} />

            <BunkerEnvironment />
            <VaultDoor onOpen={handleOpen} isOpen={isOpen} />

            {/* Post-processing — bloom for glowing elements, vignette for focus */}
            <EffectComposer>
              <Bloom
                intensity={0.8}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.9}
                mipmapBlur
              />
              <Vignette
                offset={0.3}
                darkness={0.7}
                blendFunction={BlendFunction.NORMAL}
              />
              <ChromaticAberration
                radialModulation={false}
                modulationOffset={0}
                offset={new THREE.Vector2(0.0005, 0.0005)}
                blendFunction={BlendFunction.NORMAL}
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Login panel overlay */}
      <LoginPanel visible={showLogin} />

      {/* Click hint */}
      {canvasReady && !isOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground/40">
            Click the vault to enter
          </p>
        </div>
      )}

      {loadError && (
        <div className="absolute top-4 left-4 text-[10px] text-red-500/30 font-mono">
          {loadError}
        </div>
      )}
    </div>
  )
}

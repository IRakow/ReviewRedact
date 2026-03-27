"use client"

import { Suspense, useState, useCallback, useEffect, useRef, useMemo, Component, type ReactNode } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
import { LoginPanel } from "./LoginPanel"

// ─── Error Boundary ──────────────────────────────────────────────────────────

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

// ─── Procedural Brick Texture ────────────────────────────────────────────────

function createBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  // Mortar base
  ctx.fillStyle = "#1a110c"
  ctx.fillRect(0, 0, 512, 512)

  const brickW = 58
  const brickH = 24
  const gap = 3

  for (let row = 0; row < 20; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2
    for (let col = -1; col < 10; col++) {
      const x = col * (brickW + gap) + offset
      const y = row * (brickH + gap)
      const r = 0x3d + Math.floor(Math.random() * 24 - 12)
      const g = 0x23 + Math.floor(Math.random() * 12 - 6)
      const b = 0x17 + Math.floor(Math.random() * 10 - 5)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x, y, brickW, brickH)
      // Subtle edge highlight
      ctx.fillStyle = `rgba(255,200,150,0.03)`
      ctx.fillRect(x, y, brickW, 1)
      ctx.fillRect(x, y, 1, brickH)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  return tex
}

// ─── Brick Wall Component ────────────────────────────────────────────────────

function BrickWall({ position, rotation, scale }: {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}) {
  const texture = useMemo(() => createBrickTexture(), [])

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[8, 5]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.9}
        metalness={0.05}
        color="#3d2317"
      />
    </mesh>
  )
}

// ─── Speakeasy Door ──────────────────────────────────────────────────────────

function SpeakeasyDoor({ isOpen, onOpen }: { isOpen: boolean; onOpen: () => void }) {
  const doorGroup = useRef<THREE.Group>(null)
  const targetAngle = isOpen ? -Math.PI * 0.55 : 0

  useFrame(() => {
    if (doorGroup.current) {
      doorGroup.current.rotation.y = THREE.MathUtils.lerp(
        doorGroup.current.rotation.y,
        targetAngle,
        0.025 // slow, heavy door
      )
    }
  })

  return (
    <group position={[0, 0, -4]}>
      {/* Door frame */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[1.6, 3, 0.15]} />
        <meshStandardMaterial color="#0d0704" roughness={0.7} />
      </mesh>

      {/* Door pivot group (hinges on left edge) */}
      <group ref={doorGroup} position={[-0.7, 0, 0.08]}>
        {/* Door panel */}
        <mesh
          position={[0.7, 1.4, 0]}
          onClick={onOpen}
          onPointerOver={(e) => {
            if (!isOpen) {
              document.body.style.cursor = "pointer"
              ;(e.object as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                color: "#2a1a0e",
                roughness: 0.6,
                metalness: 0.1,
              })
            }
          }}
          onPointerOut={(e) => {
            document.body.style.cursor = "auto"
            ;(e.object as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: "#1a0e05",
              roughness: 0.7,
              metalness: 0.05,
            })
          }}
        >
          <boxGeometry args={[1.35, 2.8, 0.08]} />
          <meshStandardMaterial color="#1a0e05" roughness={0.7} metalness={0.05} />
        </mesh>

        {/* Brass handle */}
        <mesh position={[1.15, 1.3, 0.06]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#c9a96e" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Brass peephole */}
        <mesh position={[0.7, 1.9, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial color="#c9a96e" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Brass plate */}
        <mesh position={[0.7, 0.9, 0.05]}>
          <boxGeometry args={[0.15, 0.4, 0.01]} />
          <meshStandardMaterial color="#a8884e" roughness={0.35} metalness={0.7} />
        </mesh>
      </group>

      {/* Warm light spill from inside (visible when door opens) */}
      <spotLight
        position={[0, 2.5, -0.5]}
        target-position={[0, 0, 2]}
        angle={0.8}
        penumbra={0.8}
        intensity={isOpen ? 4 : 0}
        color="#d4a574"
        castShadow
      />
    </group>
  )
}

// ─── Edison Bulb ─────────────────────────────────────────────────────────────

function EdisonBulb({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      // Subtle flicker
      ref.current.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 3 + position[0] * 10) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Bulb glow sphere */}
      <mesh>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.9} />
      </mesh>
      {/* Light */}
      <pointLight ref={ref} color="#d4a574" intensity={1.5} distance={5} decay={2} />
      {/* Wire */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.3, 4]} />
        <meshBasicMaterial color="#333" />
      </mesh>
    </group>
  )
}

// ─── Smoke/Dust Particles ────────────────────────────────────────────────────

function SmokeParticles({ count = 150 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5
      pos[i * 3 + 1] = Math.random() * 3.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    return geo
  }, [count])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(Date.now() * 0.0003 + i) * delta * 0.05
      pos[i * 3 + 1] += delta * 0.08
      if (pos[i * 3 + 1] > 3.5) {
        pos[i * 3 + 1] = 0
        pos[i * 3] = (Math.random() - 0.5) * 5
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.025}
        color="#d4a574"
        transparent
        opacity={0.2}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── RR Monogram (frosted glass look) ────────────────────────────────────────

function RRMonogram() {
  return (
    <group position={[0, 2.2, -4.05]}>
      {/* Frosted glass panel */}
      <mesh>
        <planeGeometry args={[0.8, 0.4]} />
        <meshStandardMaterial
          color="#c9a96e"
          roughness={0.5}
          metalness={0.6}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* "RR" text (simple geometry approach) */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.6, 0.25]} />
        <meshBasicMaterial color="#c9a96e" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

// ─── Speakeasy Interior (visible through door) ───────────────────────────────

function SpeakeasyInterior() {
  return (
    <group position={[0, 0, -6]}>
      {/* Back wall */}
      <BrickWall position={[0, 2, -2]} scale={[1.2, 1, 1]} />

      {/* Warm ambient fill */}
      <pointLight position={[0, 2.5, -1]} color="#d4a574" intensity={2} distance={8} decay={2} />

      {/* Edison bulbs inside */}
      <EdisonBulb position={[-0.8, 2.6, -0.5]} />
      <EdisonBulb position={[0.8, 2.5, -1]} />
      <EdisonBulb position={[0, 2.7, -1.5]} />

      {/* Bar counter (simple box) */}
      <mesh position={[0, 0.5, -1]}>
        <boxGeometry args={[2.5, 1, 0.5]} />
        <meshStandardMaterial color="#1a0e05" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Bar top (brass trim) */}
      <mesh position={[0, 1.01, -1]}>
        <boxGeometry args={[2.6, 0.02, 0.55]} />
        <meshStandardMaterial color="#c9a96e" roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  )
}

// ─── Camera Controller ───────────────────────────────────────────────────────

function CameraController({ doorOpen }: { doorOpen: boolean }) {
  const target = useRef(new THREE.Vector3(0, 1.5, 3.5))
  const lookTarget = useRef(new THREE.Vector3(0, 1.4, -4))

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()

    if (doorOpen) {
      // Push camera forward through the door
      target.current.lerp(new THREE.Vector3(0, 1.5, -2), 0.008)
      lookTarget.current.lerp(new THREE.Vector3(0, 1.3, -6), 0.008)
    } else {
      // Idle drift in the alley
      target.current.set(
        Math.sin(t * 0.15) * 0.08,
        1.5 + Math.sin(t * 0.12 + 1) * 0.03,
        3.5 + Math.sin(t * 0.1) * 0.04
      )
      lookTarget.current.set(0, 1.3, -4)
    }

    camera.position.lerp(target.current, 0.03)
    const lk = new THREE.Vector3()
    lk.copy(lookTarget.current)
    camera.lookAt(lk)
  })

  return null
}

// ─── Main Scene ──────────────────────────────────────────────────────────────

function SpeakeasyScene({ onOpen, isOpen }: { onOpen: () => void; isOpen: boolean }) {
  return (
    <>
      <CameraController doorOpen={isOpen} />

      {/* Fog */}
      <fog attach="fog" args={["#0a0806", 3, 14]} />

      {/* Ambient (very dim) */}
      <ambientLight intensity={0.08} color="#1a1008" />

      {/* Overhead alley light (dim, cold) */}
      <pointLight position={[0, 3.5, 1]} color="#887766" intensity={0.5} distance={8} decay={2} />

      {/* Warm glow from under the door */}
      <pointLight position={[0, 0.1, -3.5]} color="#d4a574" intensity={isOpen ? 0 : 0.6} distance={4} decay={2} />

      {/* Floor — dark stone with reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[8, 16]} />
        <meshStandardMaterial color="#0d0906" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.5, 0]}>
        <planeGeometry args={[4, 16]} />
        <meshStandardMaterial color="#0a0704" roughness={0.95} />
      </mesh>

      {/* Left wall */}
      <BrickWall position={[-1.8, 1.75, -1]} rotation={[0, Math.PI / 2, 0]} scale={[1.5, 1, 1]} />

      {/* Right wall */}
      <BrickWall position={[1.8, 1.75, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[1.5, 1, 1]} />

      {/* Back wall (around door) */}
      <BrickWall position={[0, 1.75, -4.1]} scale={[0.5, 1, 1]} />

      {/* RR monogram above door */}
      <RRMonogram />

      {/* The door */}
      <SpeakeasyDoor isOpen={isOpen} onOpen={onOpen} />

      {/* Interior (behind door) */}
      <SpeakeasyInterior />

      {/* Smoke/dust particles */}
      <SmokeParticles />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.8}
          mipmapBlur
        />
        <Vignette
          offset={0.25}
          darkness={0.8}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  )
}

// ─── Loading Screen ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0806] z-50">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-[#c9a96e]/30 bg-[#c9a96e]/5 font-mono text-lg font-bold text-[#c9a96e]">
          RR
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]/40">
          Approaching...
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="h-1 w-1 rounded-full bg-[#c9a96e]/60 animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="h-1 w-1 rounded-full bg-[#c9a96e]/60 animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="h-1 w-1 rounded-full bg-[#c9a96e]/60 animate-pulse" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function VaultRoom() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setTimeout(() => setShowLogin(true), 2200)
  }, [])

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
    <div className="relative h-screen w-screen bg-[#0a0806] overflow-hidden">
      {!canvasReady && !loadError && <LoadingScreen />}

      <ErrorBoundary
        onError={(err) => {
          setLoadError(err.message)
          setShowLogin(true)
        }}
      >
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
            gl.toneMappingExposure = 0.85
            setCanvasReady(true)
          }}
        >
          <Suspense fallback={null}>
            <SpeakeasyScene onOpen={handleOpen} isOpen={isOpen} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Login panel overlay */}
      <LoginPanel visible={showLogin} />

      {/* Click hint */}
      {canvasReady && !isOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]/30">
            Knock to enter
          </p>
        </div>
      )}

      {loadError && (
        <div className="absolute top-4 left-4 text-[10px] text-red-500/20 font-mono">
          {loadError}
        </div>
      )}
    </div>
  )
}

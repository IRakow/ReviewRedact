"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DustParticles } from "./DustParticles"

function SwingingLight() {
  const lightRef = useRef<THREE.Group>(null!)
  const coneRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.getElapsedTime()
    // Dramatic pendulum swing
    lightRef.current.rotation.z = Math.sin(t * 0.6) * 0.18
    lightRef.current.rotation.x = Math.sin(t * 0.4 + 0.5) * 0.08

    // Pulse the light cone opacity
    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.04 + Math.sin(t * 2) * 0.015
    }
  })

  return (
    <group ref={lightRef} position={[0, 3.8, 0]}>
      {/* Cord */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.8, 4]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.08, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Lamp shade */}
      <mesh position={[0, -0.02, 0]}>
        <coneGeometry args={[0.18, 0.14, 12, 1, true]} />
        <meshStandardMaterial
          color="#2a2a2a"
          side={THREE.DoubleSide}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
      {/* Bulb — bright emissive */}
      <mesh position={[0, -0.06, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color="#ffd080"
          emissive="#ffa940"
          emissiveIntensity={8}
          toneMapped={false}
        />
      </mesh>
      {/* Visible light cone (volumetric fake) */}
      <mesh ref={coneRef} position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2.5, 4.5, 32, 1, true]} />
        <meshBasicMaterial
          color="#d4a853"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Main point light — warm amber */}
      <pointLight
        position={[0, -0.1, 0]}
        color="#d4a853"
        intensity={60}
        distance={18}
        decay={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />
      {/* Secondary warm light for spread */}
      <pointLight
        position={[0, -0.5, 0]}
        color="#ffa940"
        intensity={20}
        distance={10}
        decay={2}
      />
    </group>
  )
}

function ConcreteWall({
  position,
  rotation,
  size,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#252525"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  )
}

function Pipe({
  position,
  rotation,
  length = 6,
  radius = 0.04,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  radius?: number
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshStandardMaterial
          color="#3a3a3a"
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>
      {/* Joint rings */}
      {[-length / 3, 0, length / 3].map((offset, i) => (
        <mesh key={i} position={[0, offset, 0]}>
          <torusGeometry args={[radius + 0.015, 0.012, 8, 16]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function FloorGrate() {
  // Metal grate effect on the floor
  return (
    <group position={[0, -1.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={`h${i}`} position={[(i - 7) * 0.3, 0, 0]} receiveShadow>
          <boxGeometry args={[0.02, 4, 0.01]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`v${i}`} position={[0, (i - 5) * 0.4, 0]} receiveShadow>
          <boxGeometry args={[4.5, 0.02, 0.01]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

export function BunkerEnvironment() {
  return (
    <group>
      {/* Ambient — moody blue undertone */}
      <ambientLight intensity={0.08} color="#1a2a3a" />

      {/* Swinging overhead light */}
      <SwingingLight />

      {/* Subtle blue back light — edge-lights the vault door */}
      <spotLight
        position={[3, 3, 4]}
        color="#4a7c9b"
        intensity={12}
        distance={15}
        angle={0.7}
        penumbra={0.9}
        decay={1.5}
      />
      <spotLight
        position={[-3, 3, 4]}
        color="#4a7c9b"
        intensity={8}
        distance={15}
        angle={0.7}
        penumbra={0.9}
        decay={1.5}
      />

      {/* Floor */}
      <ConcreteWall
        position={[0, -1.5, 0]}
        rotation={[0, 0, 0]}
        size={[10, 0.3, 10]}
      />

      {/* Floor grate */}
      <FloorGrate />

      {/* Ceiling */}
      <ConcreteWall
        position={[0, 4.2, 0]}
        rotation={[0, 0, 0]}
        size={[10, 0.3, 10]}
      />

      {/* Back wall (behind vault) */}
      <ConcreteWall
        position={[0, 1.5, -3]}
        rotation={[0, 0, 0]}
        size={[10, 6, 0.3]}
      />

      {/* Left wall */}
      <ConcreteWall
        position={[-5, 1.5, 0]}
        rotation={[0, 0, 0]}
        size={[0.3, 6, 10]}
      />

      {/* Right wall */}
      <ConcreteWall
        position={[5, 1.5, 0]}
        rotation={[0, 0, 0]}
        size={[0.3, 6, 10]}
      />

      {/* Ceiling pipes — more of them, varied sizes */}
      <Pipe position={[-2, 3.8, 0]} rotation={[0, 0, Math.PI / 2]} length={4} radius={0.05} />
      <Pipe position={[2.5, 3.6, -1]} rotation={[Math.PI / 2, 0, 0]} length={5} radius={0.04} />
      <Pipe position={[-3.5, 3.5, 1]} rotation={[0, 0, 0]} length={3} radius={0.03} />
      <Pipe position={[3.8, 3.7, 0.5]} rotation={[Math.PI / 2, 0, Math.PI / 6]} length={4} radius={0.035} />
      <Pipe position={[-1, 3.9, -1.5]} rotation={[0, 0, Math.PI / 2]} length={3} radius={0.025} />

      {/* Dust particles — more of them */}
      <DustParticles count={250} />
    </group>
  )
}

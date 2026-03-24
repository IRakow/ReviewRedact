"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DustParticles } from "./DustParticles"

function SwingingLight() {
  const lightRef = useRef<THREE.Group>(null!)
  const pointLightRef = useRef<THREE.PointLight>(null!)

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.getElapsedTime()
    lightRef.current.rotation.z = Math.sin(t * 0.4) * 0.08
    lightRef.current.rotation.x = Math.sin(t * 0.3 + 1) * 0.04
  })

  return (
    <group ref={lightRef} position={[0, 3.8, 0]}>
      {/* Cord */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.6, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Lamp shade */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.15, 0.12, 8, 1, true]} />
        <meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#d4a853" emissive="#d4a853" emissiveIntensity={3} />
      </mesh>
      {/* Point light */}
      <pointLight
        ref={pointLightRef}
        position={[0, -0.1, 0]}
        color="#d4a853"
        intensity={8}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
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
    <mesh position={position} rotation={rotation} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#1a1a1a"
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
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      {/* Joint rings */}
      {[-length / 3, 0, length / 3].map((offset, i) => (
        <mesh key={i} position={[0, offset, 0]}>
          <torusGeometry args={[0.05, 0.015, 8, 16]} />
          <meshStandardMaterial color="#333" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export function BunkerEnvironment() {
  return (
    <group>
      {/* Ambient fill — very dim */}
      <ambientLight intensity={0.03} color="#1a2a3a" />

      {/* Swinging overhead light */}
      <SwingingLight />

      {/* Floor */}
      <ConcreteWall
        position={[0, -1.5, 0]}
        rotation={[0, 0, 0]}
        size={[10, 0.3, 10]}
      />

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

      {/* Ceiling pipes */}
      <Pipe position={[-2, 3.8, 0]} rotation={[0, 0, Math.PI / 2]} length={4} />
      <Pipe position={[2.5, 3.6, -1]} rotation={[Math.PI / 2, 0, 0]} length={5} />
      <Pipe position={[-3.5, 3.5, 1]} rotation={[0, 0, 0]} length={3} />

      {/* Dust particles */}
      <DustParticles count={150} />

      {/* Floor fog — subtle ground plane glow */}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#0a0a0a"
          transparent
          opacity={0.8}
          roughness={0.99}
        />
      </mesh>
    </group>
  )
}

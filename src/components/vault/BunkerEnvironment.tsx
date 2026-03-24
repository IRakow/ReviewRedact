"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { DustParticles } from "./DustParticles"

function HangingLight() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    // Visible pendulum swing
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.15
    groupRef.current.rotation.x = Math.sin(t * 0.35 + 0.7) * 0.06
  })

  return (
    <group position={[0, 4.0, 0]}>
      {/* Pivot point (ceiling mount) */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Swinging group — everything below pivots */}
      <group ref={groupRef}>
        {/* Chain/cord — long visible wire */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 1.2, 4]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Industrial lamp housing */}
        <group position={[0, -1.25, 0]}>
          {/* Top cap */}
          <mesh>
            <cylinderGeometry args={[0.06, 0.08, 0.04, 12]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Shade — wide industrial cone */}
          <mesh position={[0, -0.08, 0]}>
            <coneGeometry args={[0.22, 0.16, 16, 1, true]} />
            <meshStandardMaterial
              color="#1e1e1e"
              side={THREE.DoubleSide}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          {/* Inner shade — lighter to catch light */}
          <mesh position={[0, -0.07, 0]}>
            <coneGeometry args={[0.2, 0.14, 16, 1, true]} />
            <meshStandardMaterial
              color="#4a3a2a"
              side={THREE.BackSide}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>
          {/* Bulb */}
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial
              color="#ffd080"
              emissive="#ffb040"
              emissiveIntensity={10}
              toneMapped={false}
            />
          </mesh>
          {/* Guard cage wires */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * Math.PI * 2) / 6
            const x = Math.cos(angle) * 0.07
            const z = Math.sin(angle) * 0.07
            return (
              <mesh key={i} position={[x, -0.14, z]}>
                <cylinderGeometry args={[0.003, 0.003, 0.12, 4]} />
                <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} />
              </mesh>
            )
          })}
          {/* Guard ring */}
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.07, 0.004, 6, 12]} />
            <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} />
          </mesh>

          {/* Main light */}
          <pointLight
            position={[0, -0.12, 0]}
            color="#d4a853"
            intensity={80}
            distance={18}
            decay={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {/* Warm fill */}
          <pointLight
            position={[0, -0.5, 0]}
            color="#ffa940"
            intensity={25}
            distance={12}
            decay={2}
          />
        </group>
      </group>
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
      <meshStandardMaterial color="#222" roughness={0.95} metalness={0.05} />
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
        <meshStandardMaterial color="#3a3a3a" roughness={0.3} metalness={0.9} />
      </mesh>
      {[-length / 3, 0, length / 3].map((offset, i) => (
        <mesh key={i} position={[0, offset, 0]}>
          <torusGeometry args={[radius + 0.012, 0.01, 8, 16]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

export function BunkerEnvironment() {
  return (
    <group>
      {/* Ambient — very dim blue */}
      <ambientLight intensity={0.06} color="#1a2a3a" />

      {/* Hanging industrial light */}
      <HangingLight />

      {/* Blue rim lights from the sides */}
      <spotLight
        position={[3, 2.5, 3]}
        color="#4a7c9b"
        intensity={10}
        distance={14}
        angle={0.8}
        penumbra={0.9}
        decay={1.5}
      />
      <spotLight
        position={[-3, 2.5, 3]}
        color="#4a7c9b"
        intensity={6}
        distance={14}
        angle={0.8}
        penumbra={0.9}
        decay={1.5}
      />

      {/* Floor */}
      <ConcreteWall position={[0, -1.5, 0]} rotation={[0, 0, 0]} size={[10, 0.3, 10]} />

      {/* Ceiling */}
      <ConcreteWall position={[0, 4.2, 0]} rotation={[0, 0, 0]} size={[10, 0.3, 10]} />

      {/* Back wall */}
      <ConcreteWall position={[0, 1.5, -3]} rotation={[0, 0, 0]} size={[10, 6, 0.3]} />

      {/* Left wall */}
      <ConcreteWall position={[-5, 1.5, 0]} rotation={[0, 0, 0]} size={[0.3, 6, 10]} />

      {/* Right wall */}
      <ConcreteWall position={[5, 1.5, 0]} rotation={[0, 0, 0]} size={[0.3, 6, 10]} />

      {/* Pipes */}
      <Pipe position={[-2, 3.85, 0]} rotation={[0, 0, Math.PI / 2]} length={4} radius={0.05} />
      <Pipe position={[2.5, 3.7, -1]} rotation={[Math.PI / 2, 0, 0]} length={5} radius={0.04} />
      <Pipe position={[-3.5, 3.6, 1]} rotation={[0, 0, 0]} length={3} radius={0.03} />
      <Pipe position={[3.8, 3.75, 0.5]} rotation={[Math.PI / 2, 0, Math.PI / 6]} length={4} radius={0.035} />

      {/* Particles */}
      <DustParticles count={250} />
    </group>
  )
}

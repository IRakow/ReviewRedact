"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"

interface VaultDoorProps {
  onOpen: () => void
  isOpen: boolean
}

function VaultRim() {
  return (
    <group position={[0, 1.2, -2.82]}>
      {/* Outer rim */}
      <mesh castShadow>
        <torusGeometry args={[1.35, 0.1, 16, 64]} />
        <meshStandardMaterial color="#555" roughness={0.15} metalness={0.95} />
      </mesh>
      {/* Inner rim */}
      <mesh>
        <torusGeometry args={[1.22, 0.06, 12, 64]} />
        <meshStandardMaterial color="#444" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Decorative ring — glowing steel blue */}
      <mesh>
        <torusGeometry args={[1.28, 0.008, 8, 64]} />
        <meshStandardMaterial
          color="#4a7c9b"
          emissive="#4a7c9b"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function VaultBolt({ angle, isOpen }: { angle: number; isOpen: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const targetExtend = isOpen ? -0.2 : 0.15

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetExtend, 0.04)
  })

  const x = Math.cos(angle) * 1.12
  const y = Math.sin(angle) * 1.12 + 1.2

  return (
    <group ref={ref} position={[x, y, -2.7]}>
      {/* Bolt shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.25, 8]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.25} metalness={0.95} />
      </mesh>
      {/* Bolt head */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 6]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.95} />
      </mesh>
      {/* Indicator light on each bolt */}
      <mesh position={[0, 0.14, 0.02]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color={isOpen ? "#22c55e" : "#d4a853"}
          emissive={isOpen ? "#22c55e" : "#d4a853"}
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function VaultHandle({ isOpen }: { isOpen: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const targetRot = isOpen ? Math.PI * 3 : 0
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRot, 0.025)

    // Pulse the center glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      const t = clock.getElapsedTime()
      mat.emissiveIntensity = 2 + Math.sin(t * 1.5) * 1
    }
  })

  return (
    <group ref={ref} position={[0, 1.2, -2.62]}>
      {/* Central hub — glowing */}
      <mesh ref={glowRef} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 24]} />
        <meshStandardMaterial
          color="#4a7c9b"
          roughness={0.15}
          metalness={0.95}
          emissive="#4a7c9b"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      {/* Hub ring */}
      <mesh>
        <torusGeometry args={[0.14, 0.015, 8, 24]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.95} />
      </mesh>
      {/* 5 Spokes */}
      {[0, (Math.PI * 2) / 5, (Math.PI * 4) / 5, (Math.PI * 6) / 5, (Math.PI * 8) / 5].map(
        (angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            {/* Spoke bar */}
            <mesh position={[0.32, 0, 0]} castShadow>
              <boxGeometry args={[0.4, 0.035, 0.035]} />
              <meshStandardMaterial color="#4a4a4a" roughness={0.25} metalness={0.95} />
            </mesh>
            {/* Spoke end cap */}
            <mesh position={[0.52, 0, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#555" roughness={0.2} metalness={0.9} />
            </mesh>
          </group>
        )
      )}
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[0.52, 0.025, 12, 48]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.2} metalness={0.95} />
      </mesh>
    </group>
  )
}

export function VaultDoor({ onOpen, isOpen }: VaultDoorProps) {
  const doorRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (!doorRef.current) return
    const targetRotation = isOpen ? -Math.PI / 2.2 : 0
    doorRef.current.rotation.y = THREE.MathUtils.lerp(
      doorRef.current.rotation.y,
      targetRotation,
      0.015
    )
  })

  return (
    <group>
      {/* Vault rim (stays in place) */}
      <VaultRim />

      {/* Bolts around the rim */}
      {Array.from({ length: 10 }).map((_, i) => (
        <VaultBolt key={i} angle={(i * Math.PI * 2) / 10} isOpen={isOpen} />
      ))}

      {/* Door group (pivots open from left edge) */}
      <group ref={doorRef} position={[-1.2, 0, -2.85]}>
        {/* Door disc */}
        <mesh
          position={[1.2, 1.2, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (!isOpen) onOpen()
          }}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer" }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "default" }}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1.2, 1.2, 0.18, 64]} />
          <meshStandardMaterial
            color={hovered && !isOpen ? "#4a5a6a" : "#3a3a3a"}
            roughness={0.25}
            metalness={0.9}
          />
        </mesh>

        {/* Concentric decorative rings on door face */}
        {[0.4, 0.7, 1.0].map((r, i) => (
          <mesh key={i} position={[1.2, 1.2, 0.095]}>
            <torusGeometry args={[r, 0.005, 8, 64]} />
            <meshStandardMaterial
              color="#555"
              roughness={0.2}
              metalness={0.95}
            />
          </mesh>
        ))}

        {/* Handle (on the door) */}
        <group position={[1.2, 0, 0.1]}>
          <VaultHandle isOpen={isOpen} />
        </group>

        {/* Rivets on door face — two rings */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 16
          const r = 1.05
          return (
            <mesh
              key={`outer-${i}`}
              position={[1.2 + Math.cos(angle) * r, 1.2 + Math.sin(angle) * r, 0.09]}
              castShadow
            >
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
            </mesh>
          )
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 8 + Math.PI / 8
          const r = 0.85
          return (
            <mesh
              key={`inner-${i}`}
              position={[1.2 + Math.cos(angle) * r, 1.2 + Math.sin(angle) * r, 0.09]}
              castShadow
            >
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#4a4a4a" roughness={0.3} metalness={0.9} />
            </mesh>
          )
        })}
      </group>

      {/* "REVIEW REDACT" stencil above vault */}
      <Text
        position={[0, 3.0, -2.8]}
        fontSize={0.24}
        color="#7a7a7a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.4}
      >
        REVIEW REDACT
      </Text>

      {/* Tagline below */}
      <Text
        position={[0, -0.6, -2.8]}
        fontSize={0.08}
        color="#4a4a4a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.4}
      >
        ...For those in the know...
      </Text>
    </group>
  )
}

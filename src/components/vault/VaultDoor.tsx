"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"

interface VaultDoorProps {
  onOpen: () => void
  isOpen: boolean
}

// The vault frame — circular opening in the wall
function VaultFrame() {
  return (
    <group position={[0, 1.2, -2.84]}>
      {/* Thick outer rim ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.15, 16, 64]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.15} metalness={0.95} />
      </mesh>
      {/* Inner rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.08, 12, 64]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Glowing accent ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.32, 0.006, 8, 64]} />
        <meshStandardMaterial
          color="#4a7c9b"
          emissive="#4a7c9b"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

// Locking bolts around the door
function VaultBolt({ angle, isOpen }: { angle: number; isOpen: boolean }) {
  const ref = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!ref.current) return
    // Bolts retract inward when open
    const target = isOpen ? 1.0 : 1.3
    const currentR = ref.current.userData.r || 1.3
    const newR = THREE.MathUtils.lerp(currentR, target, 0.04)
    ref.current.userData.r = newR

    ref.current.position.x = Math.cos(angle) * newR
    ref.current.position.y = Math.sin(angle) * newR + 1.2
  })

  const x = Math.cos(angle) * 1.3
  const y = Math.sin(angle) * 1.3 + 1.2

  return (
    <group ref={ref} position={[x, y, -2.78]}>
      {/* Bolt cylinder — horizontal, pointing outward from center */}
      <mesh rotation={[0, 0, angle]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.95} />
      </mesh>
      {/* Indicator light */}
      <mesh position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial
          color={isOpen ? "#22c55e" : "#d4a853"}
          emissive={isOpen ? "#22c55e" : "#d4a853"}
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

// The combination wheel/handle
function VaultWheel({ isOpen }: { isOpen: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const targetRot = isOpen ? Math.PI * 4 : 0
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRot, 0.02)

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      const t = clock.getElapsedTime()
      mat.emissiveIntensity = 2.5 + Math.sin(t * 1.5) * 1
    }
  })

  return (
    <group ref={ref} position={[0, 1.2, -2.68]}>
      {/* Center hub — glowing */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 32]} />
        <meshStandardMaterial
          color="#4a7c9b"
          roughness={0.1}
          metalness={0.95}
          emissive="#4a7c9b"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      {/* Hub rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.012, 8, 32]} />
        <meshStandardMaterial color="#555" roughness={0.15} metalness={0.95} />
      </mesh>
      {/* 5 spokes */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * Math.PI * 2) / 5
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.36, 0.03, 0.03]} />
              <meshStandardMaterial color="#4a4a4a" roughness={0.2} metalness={0.95} />
            </mesh>
            <mesh position={[0.48, 0, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#555" roughness={0.15} metalness={0.9} />
            </mesh>
          </group>
        )
      })}
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.02, 12, 48]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.15} metalness={0.95} />
      </mesh>
    </group>
  )
}

export function VaultDoor({ onOpen, isOpen }: VaultDoorProps) {
  const doorPivot = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (!doorPivot.current) return
    // Door swings open on Y axis from left edge
    const targetY = isOpen ? -Math.PI / 2.5 : 0
    doorPivot.current.rotation.y = THREE.MathUtils.lerp(
      doorPivot.current.rotation.y,
      targetY,
      0.012
    )
  })

  return (
    <group>
      {/* Fixed frame in the wall */}
      <VaultFrame />

      {/* Locking bolts (fixed to frame, retract when opening) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <VaultBolt key={i} angle={(i * Math.PI * 2) / 12} isOpen={isOpen} />
      ))}

      {/* Door pivot group — hinge on left edge */}
      <group ref={doorPivot} position={[-1.2, 0, -2.85]}>
        {/* The actual door — a thick disc facing the camera */}
        <mesh
          position={[1.2, 1.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (!isOpen) onOpen()
          }}
          onPointerOver={() => {
            setHovered(true)
            document.body.style.cursor = "pointer"
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = "default"
          }}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1.2, 1.2, 0.2, 64]} />
          <meshStandardMaterial
            color={hovered && !isOpen ? "#4a5060" : "#383838"}
            roughness={0.25}
            metalness={0.9}
          />
        </mesh>

        {/* Concentric rings on door face */}
        {[0.3, 0.6, 0.9, 1.1].map((r, i) => (
          <mesh key={i} position={[1.2, 1.2, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.004, 8, 64]} />
            <meshStandardMaterial color="#505050" roughness={0.2} metalness={0.9} />
          </mesh>
        ))}

        {/* Rivets — outer ring */}
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 20
          return (
            <mesh
              key={i}
              position={[1.2 + Math.cos(a) * 1.08, 1.2 + Math.sin(a) * 1.08, 0.11]}
            >
              <sphereGeometry args={[0.018, 6, 6]} />
              <meshStandardMaterial color="#505050" roughness={0.3} metalness={0.9} />
            </mesh>
          )
        })}

        {/* Wheel handle — on the door, moves with it */}
        <group position={[1.2, 0, 0.12]}>
          <VaultWheel isOpen={isOpen} />
        </group>
      </group>

      {/* Text above vault */}
      <Text
        position={[0, 3.1, -2.82]}
        fontSize={0.22}
        color="#6a6a6a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.4}
      >
        REVIEW REDACT
      </Text>

      {/* Tagline */}
      <Text
        position={[0, -0.7, -2.82]}
        fontSize={0.075}
        color="#3a3a3a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.35}
      >
        ...For those in the know...
      </Text>
    </group>
  )
}

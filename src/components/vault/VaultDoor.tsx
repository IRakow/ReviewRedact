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
    <mesh position={[0, 1.2, -2.82]} castShadow>
      <torusGeometry args={[1.3, 0.12, 16, 48]} />
      <meshStandardMaterial
        color="#4a4a4a"
        roughness={0.2}
        metalness={0.95}
      />
    </mesh>
  )
}

function VaultBolt({ angle, isOpen }: { angle: number; isOpen: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  const targetExtend = isOpen ? -0.15 : 0.12

  useFrame(() => {
    if (!ref.current) return
    const currentZ = ref.current.position.z
    ref.current.position.z = THREE.MathUtils.lerp(currentZ, targetExtend, 0.05)
  })

  const x = Math.cos(angle) * 1.05
  const y = Math.sin(angle) * 1.05 + 1.2

  return (
    <mesh ref={ref} position={[x, y, -2.7]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
      <meshStandardMaterial
        color="#6a6a6a"
        roughness={0.3}
        metalness={0.9}
      />
    </mesh>
  )
}

function VaultHandle({ isOpen }: { isOpen: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const rotationTarget = useRef(0)

  useFrame(() => {
    if (!ref.current) return
    rotationTarget.current = isOpen ? Math.PI * 2 : 0
    ref.current.rotation.z = THREE.MathUtils.lerp(
      ref.current.rotation.z,
      rotationTarget.current,
      0.03
    )
  })

  return (
    <group ref={ref} position={[0, 1.2, -2.65]}>
      {/* Central hub */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
        <meshStandardMaterial
          color="#4a7c9b"
          roughness={0.2}
          metalness={0.95}
          emissive="#4a7c9b"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Spokes */}
      {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map(
        (angle, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0]}
            rotation={[0, 0, angle]}
            castShadow
          >
            <boxGeometry args={[0.35, 0.04, 0.04]} />
            <meshStandardMaterial
              color="#6a6a6a"
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
        )
      )}
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[0.45, 0.03, 8, 32]} />
        <meshStandardMaterial
          color="#333"
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>
    </group>
  )
}

export function VaultDoor({ onOpen, isOpen }: VaultDoorProps) {
  const doorRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (!doorRef.current) return
    const targetRotation = isOpen ? -Math.PI / 2.5 : 0
    doorRef.current.rotation.y = THREE.MathUtils.lerp(
      doorRef.current.rotation.y,
      targetRotation,
      0.02
    )
  })

  return (
    <group>
      {/* Vault rim (stays in place) */}
      <VaultRim />

      {/* Bolts around the rim */}
      {Array.from({ length: 8 }).map((_, i) => (
        <VaultBolt
          key={i}
          angle={(i * Math.PI * 2) / 8}
          isOpen={isOpen}
        />
      ))}

      {/* Door group (pivots open) */}
      <group
        ref={doorRef}
        position={[-1.2, 0, -2.85]}
      >
        {/* Door disc — pivots from left edge */}
        <mesh
          position={[1.2, 1.2, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (!isOpen) onOpen()
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <cylinderGeometry args={[1.2, 1.2, 0.15, 48]} />
          <meshStandardMaterial
            color={hovered && !isOpen ? "#4a5a6a" : "#3a3a3a"}
            roughness={0.3}
            metalness={0.85}
          />
        </mesh>

        {/* Handle (on the door) */}
        <group position={[1.2, 0, 0.08]}>
          <VaultHandle isOpen={isOpen} />
        </group>

        {/* Rivets on door face */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 12
          const r = 0.95
          return (
            <mesh
              key={i}
              position={[
                1.2 + Math.cos(angle) * r,
                1.2 + Math.sin(angle) * r,
                0.08,
              ]}
              castShadow
            >
              <sphereGeometry args={[0.025, 6, 6]} />
              <meshStandardMaterial
                color="#4a4a4a"
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
          )
        })}
      </group>

      {/* "REVIEW REDACT" stencil above vault */}
      <Text
        position={[0, 3.0, -2.8]}
        fontSize={0.22}
        color="#6a6a6a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.35}
      >
        REVIEW REDACT
      </Text>

      {/* Tagline below */}
      <Text
        position={[0, -0.6, -2.8]}
        fontSize={0.07}
        color="#4a4a4a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.5}
      >
        ...For those in the know...
      </Text>

      {/* Hover cursor change */}
      {hovered && !isOpen && (
        <mesh visible={false}>
          <boxGeometry args={[0, 0, 0]} />
        </mesh>
      )}
    </group>
  )
}

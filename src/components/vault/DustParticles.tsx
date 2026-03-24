"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function DustParticles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!)

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const opacities = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = Math.random() * 5 - 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      speeds[i] = 0.002 + Math.random() * 0.005
      opacities[i] = 0.2 + Math.random() * 0.5
    }

    return { positions, speeds, opacities }
  }, [count])

  useFrame((_, delta) => {
    if (!mesh.current) return
    const positions = mesh.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += particles.speeds[i] * delta * 60
      positions[i * 3] += Math.sin(Date.now() * 0.0003 + i) * 0.0003

      if (positions[i * 3 + 1] > 4) {
        positions[i * 3 + 1] = -1
        positions[i * 3] = (Math.random() - 0.5) * 8
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#4a7c9b"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

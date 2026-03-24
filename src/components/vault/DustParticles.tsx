"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function DustParticles({ count = 200 }: { count?: number }) {
  const dustRef = useRef<THREE.Points>(null!)
  const embersRef = useRef<THREE.Points>(null!)
  const emberCount = Math.floor(count / 8)

  // Dust motes
  const dust = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9
      positions[i * 3 + 1] = Math.random() * 5 - 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      speeds[i] = 0.001 + Math.random() * 0.004
    }

    return { positions, speeds }
  }, [count])

  // Glowing embers — fewer, brighter
  const embers = useMemo(() => {
    const positions = new Float32Array(emberCount * 3)
    const speeds = new Float32Array(emberCount)

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = Math.random() * 3 - 0.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      speeds[i] = 0.003 + Math.random() * 0.008
    }

    return { positions, speeds }
  }, [emberCount])

  useFrame((_, delta) => {
    // Animate dust
    if (dustRef.current) {
      const pos = dustRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += dust.speeds[i] * delta * 60
        pos[i * 3] += Math.sin(Date.now() * 0.0002 + i * 0.5) * 0.0002
        pos[i * 3 + 2] += Math.cos(Date.now() * 0.0003 + i * 0.3) * 0.0001

        if (pos[i * 3 + 1] > 4) {
          pos[i * 3 + 1] = -1
          pos[i * 3] = (Math.random() - 0.5) * 9
          pos[i * 3 + 2] = (Math.random() - 0.5) * 8
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Animate embers
    if (embersRef.current) {
      const pos = embersRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < emberCount; i++) {
        pos[i * 3 + 1] += embers.speeds[i] * delta * 60
        pos[i * 3] += Math.sin(Date.now() * 0.001 + i * 2) * 0.001

        if (pos[i * 3 + 1] > 4) {
          pos[i * 3 + 1] = -0.5
          pos[i * 3] = (Math.random() - 0.5) * 4
          pos[i * 3 + 2] = (Math.random() - 0.5) * 4
        }
      }
      embersRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <>
      {/* Dust motes — small, dim, steel blue */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.012}
          color="#6a9bba"
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Embers — larger, brighter, amber */}
      <points ref={embersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[embers.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color="#d4a853"
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}

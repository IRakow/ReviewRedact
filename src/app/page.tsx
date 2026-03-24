"use client"

import dynamic from "next/dynamic"

// Dynamic import with no SSR — Three.js requires browser APIs
const VaultRoom = dynamic(
  () => import("@/components/vault/VaultRoom").then((mod) => mod.VaultRoom),
  { ssr: false }
)

export default function Home() {
  return <VaultRoom />
}

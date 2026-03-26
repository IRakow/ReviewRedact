"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface SignaturePadProps {
  onSign: (data: { type: "draw" | "typed"; image_data?: string; typed_name?: string; font?: string }) => void
  disabled?: boolean
}

const SCRIPT_FONTS = [
  { name: "Dancing Script", css: "'Dancing Script', cursive" },
  { name: "Great Vibes", css: "'Great Vibes', cursive" },
  { name: "Sacramento", css: "'Sacramento', cursive" },
]

export function SignaturePad({ onSign, disabled }: SignaturePadProps) {
  const [mode, setMode] = useState<"draw" | "typed">("draw")
  const [typedName, setTypedName] = useState("")
  const [selectedFont, setSelectedFont] = useState(0)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = "#e0e0e0"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  useEffect(() => {
    if (mode === "draw") initCanvas()
  }, [mode, initCanvas])

  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (disabled) return
    e.preventDefault()
    isDrawing.current = true
    lastPoint.current = getCanvasPoint(e)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !lastPoint.current) return

    const point = getCanvasPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPoint.current = point
    setHasDrawn(true)
  }

  function stopDraw() {
    isDrawing.current = false
    lastPoint.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  function handleSign() {
    if (disabled) return

    if (mode === "draw") {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) return
      const imageData = canvas.toDataURL("image/png")
      onSign({ type: "draw", image_data: imageData })
    } else {
      if (!typedName.trim()) return
      onSign({ type: "typed", typed_name: typedName.trim(), font: SCRIPT_FONTS[selectedFont].name })
    }
  }

  const canSign = mode === "draw" ? hasDrawn : typedName.trim().length > 0

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
            mode === "draw"
              ? "border-steel/50 bg-steel/15 text-steel"
              : "border-border bg-surface text-muted-foreground hover:border-steel/30"
          )}
        >
          Draw Signature
        </button>
        <button
          type="button"
          onClick={() => setMode("typed")}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
            mode === "typed"
              ? "border-steel/50 bg-steel/15 text-steel"
              : "border-border bg-surface text-muted-foreground hover:border-steel/30"
          )}
        >
          Type Signature
        </button>
      </div>

      {/* Signature area */}
      {mode === "draw" ? (
        <div className="space-y-2">
          <div className="relative rounded-sm border border-border bg-[#0a0a0a] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-32 cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider">
                  Sign here
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full legal name"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-border focus:border-steel/50 focus:outline-none focus:ring-1 focus:ring-steel/30 transition-colors"
            disabled={disabled}
          />
          {/* Font preview */}
          <div className="flex gap-2">
            {SCRIPT_FONTS.map((font, i) => (
              <button
                key={font.name}
                type="button"
                onClick={() => setSelectedFont(i)}
                className={cn(
                  "flex-1 rounded-sm border py-3 text-center transition-colors",
                  i === selectedFont
                    ? "border-steel/50 bg-steel/10"
                    : "border-border bg-surface hover:border-steel/30"
                )}
              >
                <span
                  className="text-lg text-foreground"
                  style={{ fontFamily: font.css }}
                >
                  {typedName || "Your Name"}
                </span>
              </button>
            ))}
          </div>
          {/* Google Fonts link for script fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Dancing+Script&family=Great+Vibes&family=Sacramento&display=swap"
            rel="stylesheet"
          />
        </div>
      )}

      {/* Sign button */}
      <button
        type="button"
        onClick={handleSign}
        disabled={!canSign || disabled}
        className="w-full rounded-sm border border-steel/30 bg-steel/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-steel transition-all hover:bg-steel/20 hover:border-steel/50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {disabled ? "Signing..." : "Sign Document"}
      </button>
    </div>
  )
}

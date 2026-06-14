"use client"

import { cn } from "@/lib/utils"
import { SYMBOLS, type SymbolId } from "@/lib/slot-engine"

const ROYAL_TINT: Record<string, string> = {
  A: "oklch(0.78 0.13 25)", // ruby
  K: "oklch(0.74 0.11 190)", // turquoise
  Q: "oklch(0.7 0.12 145)", // emerald
  J: "oklch(0.72 0.13 60)", // amber
  T: "oklch(0.7 0.1 250)", // sapphire
}

interface SymbolTileProps {
  symbol: SymbolId
  winning?: boolean
  dropping?: boolean
  dropDelay?: number
}

export function SymbolTile({ symbol, winning, dropping, dropDelay = 0 }: SymbolTileProps) {
  const def = SYMBOLS[symbol]
  const isRoyal = def.image === null

  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center rounded-md",
        "bg-gradient-to-b from-white/[0.06] to-black/30 ring-1 ring-inset ring-white/5",
        dropping && "animate-drop",
        winning && "animate-win z-10 ring-[var(--gold)]/70",
      )}
      style={dropping ? { animationDelay: `${dropDelay}ms` } : undefined}
    >
      {isRoyal ? (
        <span
          className="font-heading text-2xl font-extrabold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-3xl md:text-4xl"
          style={{
            color: ROYAL_TINT[symbol],
            textShadow: `0 0 14px ${ROYAL_TINT[symbol]}55`,
          }}
        >
          {symbol === "T" ? "10" : symbol}
        </span>
      ) : (
        <img
          src={def.image! || "/placeholder.svg"}
          alt={def.label}
          className={cn(
            "h-[78%] w-[78%] object-contain transition-transform",
            winning ? "scale-110 drop-shadow-[0_0_12px_rgba(231,184,80,0.7)]" : "drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]",
          )}
          draggable={false}
        />
      )}
      {winning && (
        <span className="pointer-events-none absolute inset-0 rounded-md bg-[var(--gold)]/10" />
      )}
    </div>
  )
}

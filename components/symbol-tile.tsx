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
  const tint = isRoyal ? ROYAL_TINT[symbol] : undefined

  return (
    <div
      className={cn(
        "group relative flex aspect-square w-full items-center justify-center rounded-xl",
        // engraved obsidian tile with inset highlight + gold hairline
        "bg-gradient-to-b from-white/[0.09] via-white/[0.02] to-black/45",
        "ring-1 ring-inset ring-white/[0.08]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-8px_18px_-12px_rgba(0,0,0,0.8)]",
        dropping && "animate-drop",
        winning && "animate-win z-10 ring-[var(--gold)]/80",
      )}
      style={dropping ? { animationDelay: `${dropDelay}ms` } : undefined}
    >
      {/* faint gem aura tinted to the symbol */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-40"
        style={{
          background: `radial-gradient(75% 65% at 50% 35%, ${
            tint ?? "oklch(0.83 0.14 85)"
          }22, transparent 70%)`,
        }}
      />

      {isRoyal ? (
        <span
          className="relative font-heading text-2xl font-extrabold leading-none sm:text-3xl md:text-[2.4rem]"
          style={{
            color: tint,
            textShadow: `0 0 16px ${tint}66, 0 2px 4px rgba(0,0,0,0.7)`,
          }}
        >
          {symbol === "T" ? "10" : symbol}
        </span>
      ) : (
        <img
          src={def.image! || "/placeholder.svg"}
          alt={def.label}
          className={cn(
            "relative h-[80%] w-[80%] object-contain transition-transform duration-300",
            winning
              ? "scale-[1.14] drop-shadow-[0_0_16px_rgba(231,184,80,0.85)]"
              : "drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] group-hover:scale-[1.04]",
          )}
          draggable={false}
        />
      )}

      {/* win overlay: glowing wash + corner sparks */}
      {winning && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-[var(--gold)]/12" />
          <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[var(--gold)]/60" />
        </>
      )}
    </div>
  )
}

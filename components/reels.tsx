"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { SYMBOLS, type Grid, type SymbolId } from "@/lib/slot-engine"
import { SymbolTile } from "./symbol-tile"

const GAP = 6 // px, matches gap-1.5
const SYMBOL_IDS = Object.keys(SYMBOLS) as SymbolId[]

function randSym(): SymbolId {
  return SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)]
}

interface ReelsProps {
  grid: Grid
  winningPositions: Set<string>
  spinning: boolean
  dropping: boolean
  /** how many reels (from the left) have already stopped this spin */
  stoppedReels: number
}

/** A vertical strip of random symbols that rolls continuously while the reel spins. */
function SpinningReel({ side, rows }: { side: string; rows: number }) {
  // Duplicate the symbol set so translateY(-50% → 0) loops seamlessly.
  const strip = useMemo(() => {
    const base = Array.from({ length: Math.max(rows + 3, 5) }, randSym)
    return [...base, ...base]
  }, [rows])

  return (
    <div className="absolute inset-0 flex items-start justify-center overflow-hidden rounded-2xl">
      <div className="animate-reel-roll flex flex-col items-center gap-1.5 blur-[1.5px] brightness-90 sm:gap-2">
        {strip.map((s, i) => (
          <div key={i} style={{ width: side, height: side }} className="shrink-0">
            <SymbolTile symbol={s} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Reels({ grid, winningPositions, spinning, dropping, stoppedReels }: ReelsProps) {
  return (
    <div
      className="grid grid-cols-6 gap-1.5 [--reel-h:300px] [--reel-w:50px] sm:gap-2 sm:[--reel-h:392px] sm:[--reel-w:84px] md:[--reel-h:452px] md:[--reel-w:112px] lg:[--reel-h:484px] lg:[--reel-w:124px]"
      aria-label="Pelin rullat"
    >
      {grid.map((col, reel) => {
        const rows = col.length
        const side = `min(var(--reel-w), calc((var(--reel-h) - ${(rows - 1) * GAP}px) / ${rows}))`
        const rolling = spinning && reel >= stoppedReels
        const justStopped = spinning && reel < stoppedReels
        return (
          <div
            key={reel}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl sm:gap-2",
              // subtle reel channel behind each column
              "bg-gradient-to-b from-white/[0.02] to-black/20 px-0.5 py-1 ring-1 ring-inset ring-white/[0.04]",
            )}
            style={{ height: "var(--reel-h)", width: "calc(var(--reel-w) + 8px)" }}
          >
            {rolling ? (
              <SpinningReel side={side} rows={rows} />
            ) : (
              <div
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1.5 sm:gap-2",
                  justStopped && "animate-reel-land",
                )}
              >
                {col.map((symbol, row) => (
                  <div
                    key={`${reel}-${row}`}
                    style={{ width: side, height: side }}
                    className="shrink-0"
                  >
                    <SymbolTile
                      symbol={symbol}
                      winning={winningPositions.has(`${reel}:${row}`)}
                      dropping={dropping}
                      dropDelay={reel * 60 + row * 30}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

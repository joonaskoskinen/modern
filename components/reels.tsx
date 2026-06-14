"use client"

import { cn } from "@/lib/utils"
import type { Grid } from "@/lib/slot-engine"
import { SymbolTile } from "./symbol-tile"

const GAP = 6 // px, matches gap-1.5

interface ReelsProps {
  grid: Grid
  winningPositions: Set<string>
  spinning: boolean
  dropping: boolean
}

export function Reels({ grid, winningPositions, spinning, dropping }: ReelsProps) {
  return (
    <div
      className="grid grid-cols-6 gap-1.5 [--reel-h:300px] [--reel-w:50px] sm:gap-2 sm:[--reel-h:392px] sm:[--reel-w:84px] md:[--reel-h:452px] md:[--reel-w:112px] lg:[--reel-h:484px] lg:[--reel-w:124px]"
      aria-label="Pelin rullat"
    >
      {grid.map((col, reel) => {
        const rows = col.length
        const side = `min(var(--reel-w), calc((var(--reel-h) - ${(rows - 1) * GAP}px) / ${rows}))`
        return (
          <div
            key={reel}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-2xl sm:gap-2",
              // subtle reel channel behind each column
              "bg-gradient-to-b from-white/[0.02] to-black/20 px-0.5 py-1 ring-1 ring-inset ring-white/[0.04]",
            )}
            style={{ height: "var(--reel-h)", width: "calc(var(--reel-w) + 8px)" }}
          >
            {col.map((symbol, row) => (
              <div
                key={`${reel}-${row}`}
                style={{ width: side, height: side }}
                className={cn(
                  "shrink-0 transition-[filter] duration-150",
                  spinning && "blur-[2px] brightness-90",
                )}
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
        )
      })}
    </div>
  )
}

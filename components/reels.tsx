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
      className="grid grid-cols-6 gap-1.5 [--reel-w:46px] [--reel-h:280px] sm:[--reel-w:80px] sm:[--reel-h:380px] md:[--reel-w:108px] md:[--reel-h:440px]"
      aria-label="Pelin rullat"
    >
      {grid.map((col, reel) => {
        const rows = col.length
        const side = `min(var(--reel-w), calc((var(--reel-h) - ${(rows - 1) * GAP}px) / ${rows}))`
        return (
          <div
            key={reel}
            className="flex flex-col items-center justify-center gap-1.5"
            style={{ height: "var(--reel-h)", width: "var(--reel-w)" }}
          >
            {col.map((symbol, row) => (
              <div
                key={`${reel}-${row}`}
                style={{ width: side, height: side }}
                className={cn("shrink-0", spinning && "blur-[1px]")}
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

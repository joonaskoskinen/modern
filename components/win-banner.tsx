"use client"

import { cn } from "@/lib/utils"
import { formatCoins } from "@/lib/slot-engine"

interface WinBannerProps {
  amount: number
  tier: "big" | "mega" | "epic"
}

const TITLES: Record<WinBannerProps["tier"], string> = {
  big: "Iso voitto",
  mega: "Mega voitto",
  epic: "Eeppinen voitto",
}

export function WinBanner({ amount, tier }: WinBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px]" />
      <div className="animate-pop relative flex flex-col items-center">
        <div
          className={cn(
            "absolute -inset-x-40 -inset-y-24 -z-10 rounded-full blur-3xl",
            tier === "epic" ? "bg-[var(--gold)]/25" : "bg-[var(--gold)]/15",
          )}
        />
        <p className="font-heading text-sm tracking-[0.5em] text-[var(--turquoise)] uppercase sm:text-base">
          {TITLES[tier]}
        </p>
        <p className="gold-text font-heading text-5xl font-black tabular-nums drop-shadow-[0_4px_20px_rgba(231,184,80,0.5)] sm:text-7xl md:text-8xl">
          {formatCoins(amount)}
        </p>
        <p className="font-heading text-lg tracking-[0.3em] text-foreground/80 uppercase sm:text-xl">
          kolikkoa
        </p>
      </div>
    </div>
  )
}

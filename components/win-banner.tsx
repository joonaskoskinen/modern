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
  const isEpic = tier === "epic"
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[3px]" />

      {/* radiant rings */}
      <div className="absolute flex items-center justify-center">
        {[0, 0.4, 0.8].map((d) => (
          <span
            key={d}
            className="animate-ring-burst absolute size-48 rounded-full border border-[var(--gold)]/40 sm:size-72"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>

      <div className="animate-banner relative flex flex-col items-center">
        <div
          className={cn(
            "absolute -inset-x-44 -inset-y-28 -z-10 rounded-full blur-3xl",
            isEpic ? "bg-[var(--gold)]/30" : "bg-[var(--gold)]/18",
          )}
        />
        <div className="mb-1 flex items-center gap-3">
          <span className="h-px w-8 rule-gold sm:w-14" />
          <p className="font-heading text-sm uppercase tracking-emblem text-[var(--turquoise)] sm:text-base">
            {TITLES[tier]}
          </p>
          <span className="h-px w-8 rule-gold sm:w-14" />
        </div>
        <p className="gold-text font-heading text-6xl font-black tabular-nums drop-shadow-[0_4px_24px_rgba(231,184,80,0.6)] sm:text-7xl md:text-8xl">
          {formatCoins(amount)}
        </p>
        <p className="font-heading text-base uppercase tracking-[0.4em] text-foreground/75 sm:text-lg">
          kolikkoa
        </p>
      </div>
    </div>
  )
}

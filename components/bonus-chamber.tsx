"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  createBonus,
  pickChest,
  formatCoins,
  type BonusState,
} from "@/lib/slot-engine"
import { Button } from "@/components/ui/button"

interface BonusChamberProps {
  bet: number
  onComplete: (winCoins: number) => void
}

export function BonusChamber({ bet, onComplete }: BonusChamberProps) {
  const [state, setState] = useState<BonusState>(() => createBonus())

  const totalWin = state.collected * bet
  const exitsLeft = state.chests.filter((c) => c.kind === "exit" && !c.revealed).length

  function handlePick(id: number) {
    setState((prev) => pickChest(prev, id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div
        className="glass animate-banner relative mx-4 w-full max-w-3xl rounded-2xl border border-[var(--gold)]/35 p-5 panel-glow sm:p-8"
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 50% -10%, oklch(0.83 0.14 85 / 0.14), transparent 60%)",
        }}
      >
        <div className="text-center">
          <p className="font-heading text-xs uppercase tracking-emblem text-[var(--turquoise)]">
            Bonuspeli
          </p>
          <h2 className="gold-text font-heading text-2xl font-extrabold tracking-wide sm:text-4xl">
            Aarrekammio
          </h2>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Avaa arkkuja ja kerää kolikoita. Jatka kunnes paljastat Anubiksen sinetin —
            silloin kammio sulkeutuu ja voittosi maksetaan.
          </p>
        </div>

        {/* Score */}
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-6 rounded-xl border border-white/10 bg-black/30 px-6 py-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Kerätty</p>
            <p className="gold-text font-heading text-xl font-extrabold sm:text-2xl">
              {formatCoins(totalWin)}
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sinettejä jäljellä</p>
            <p className="font-heading text-xl font-extrabold text-[var(--turquoise)] sm:text-2xl">
              {exitsLeft}
            </p>
          </div>
        </div>

        {/* Chest grid */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {state.chests.map((chest) => {
            const isExit = chest.kind === "exit"
            return (
              <button
                key={chest.id}
                type="button"
                disabled={chest.revealed || state.finished}
                onClick={() => handlePick(chest.id)}
                className={cn(
                  "group relative flex aspect-square items-center justify-center rounded-xl border transition-all duration-200",
                  "border-white/10 bg-gradient-to-b from-white/[0.05] to-black/30",
                  !chest.revealed &&
                    !state.finished &&
                    "cursor-pointer hover:-translate-y-1 hover:border-[var(--gold)]/60 hover:shadow-[0_0_24px_-4px_rgba(231,184,80,0.5)]",
                  chest.revealed && isExit && "border-destructive/60 bg-destructive/10",
                  chest.revealed && !isExit && "animate-pop border-[var(--gold)]/60 bg-[var(--gold)]/10",
                )}
              >
                {!chest.revealed ? (
                  <img
                    src="/chest.png"
                    alt="Suljettu arkku"
                    className="h-[70%] w-[70%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105"
                    draggable={false}
                  />
                ) : isExit ? (
                  <div className="flex flex-col items-center gap-1">
                    <img
                      src="/sym-eye.png"
                      alt="Anubiksen sinetti"
                      className="size-9 object-contain opacity-70 grayscale"
                      draggable={false}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-destructive">
                      Sinetti
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <img
                      src="/chest-open.png"
                      alt="Avattu arkku"
                      className="h-[58%] w-[58%] object-contain"
                      draggable={false}
                    />
                    <span className="gold-text font-heading text-lg font-extrabold leading-none">
                      +{formatCoins(chest.multiplier * bet)}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {state.finished ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Kammio sulkeutui — voittosi</p>
            <p className="gold-text font-heading text-3xl font-extrabold sm:text-4xl">
              {formatCoins(totalWin)} <span className="text-xl">kolikkoa</span>
            </p>
            <Button
              size="lg"
              onClick={() => onComplete(totalWin)}
              className="mt-4 bg-[var(--gold)] font-heading text-base font-bold tracking-wide text-[var(--primary-foreground)] hover:bg-[var(--gold-soft)]"
            >
              Kerää voitto
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Valitse arkku jatkaaksesi
          </p>
        )}
      </div>
    </div>
  )
}

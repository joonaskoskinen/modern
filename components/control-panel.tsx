"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatCoins } from "@/lib/slot-engine"
import { Minus, Plus, Play, BookOpen, RefreshCw } from "lucide-react"

const BETS = [5, 10, 20, 50, 100, 200, 500]

interface ControlPanelProps {
  balance: number
  bet: number
  lastWin: number
  ways: number
  spinning: boolean
  canSpin: boolean
  autoplay: boolean
  onBetChange: (bet: number) => void
  onSpin: () => void
  onToggleAuto: () => void
  onOpenPaytable: () => void
}

export function ControlPanel({
  balance,
  bet,
  lastWin,
  ways,
  spinning,
  canSpin,
  autoplay,
  onBetChange,
  onSpin,
  onToggleAuto,
  onOpenPaytable,
}: ControlPanelProps) {
  const betIndex = BETS.indexOf(bet)
  const dec = () => betIndex > 0 && onBetChange(BETS[betIndex - 1])
  const inc = () => betIndex < BETS.length - 1 && onBetChange(BETS[betIndex + 1])

  return (
    <div className="glass w-full rounded-2xl border border-[var(--gold)]/25 p-3 panel-glow sm:p-4">
      {/* Stat strip */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center sm:mb-4">
        <Stat label="Saldo" value={formatCoins(balance)} />
        <Stat label="Voitto" value={formatCoins(lastWin)} highlight={lastWin > 0} />
        <Stat label="Tavat" value={formatCoins(ways)} accent />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
        {/* Bet control */}
        <div className="flex flex-1 items-center justify-between gap-1 rounded-xl border border-white/10 bg-black/40 p-1 sm:flex-none sm:justify-start">
          <button
            type="button"
            onClick={dec}
            disabled={betIndex <= 0 || spinning}
            aria-label="Pienennä panosta"
            className="flex size-10 items-center justify-center rounded-lg text-foreground/80 transition hover:bg-white/10 active:scale-95 disabled:opacity-30 sm:size-11"
          >
            <Minus className="size-4" />
          </button>
          <div className="min-w-[60px] px-1 text-center sm:min-w-[84px]">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">
              Panos
            </p>
            <p className="font-heading text-base font-bold text-foreground sm:text-lg">
              {formatCoins(bet)}
            </p>
          </div>
          <button
            type="button"
            onClick={inc}
            disabled={betIndex >= BETS.length - 1 || spinning}
            aria-label="Suurenna panosta"
            className="flex size-10 items-center justify-center rounded-lg text-foreground/80 transition hover:bg-white/10 active:scale-95 disabled:opacity-30 sm:size-11"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Spin */}
        <Button
          onClick={onSpin}
          disabled={!canSpin}
          className={cn(
            "sheen relative order-last h-[60px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold-deep)] font-heading text-base font-extrabold uppercase tracking-[0.15em] text-[var(--primary-foreground)] sm:order-none sm:w-auto sm:flex-1 sm:text-lg",
            "border border-[var(--gold-soft)]/60 shadow-[0_10px_30px_-8px_rgba(231,184,80,0.7),inset_0_1px_0_0_rgba(255,255,255,0.4)]",
            "transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:saturate-50",
          )}
        >
          <Play className={cn("mr-1.5 size-5 fill-current", spinning && "animate-spin")} />
          {spinning ? "Pyörii…" : "Pyöräytä"}
        </Button>

        {/* Auto */}
        <button
          type="button"
          onClick={onToggleAuto}
          aria-pressed={autoplay}
          aria-label="Automaattipyöräytys"
          className={cn(
            "flex size-[60px] flex-col items-center justify-center gap-0.5 rounded-xl border transition active:scale-95",
            autoplay
              ? "border-[var(--turquoise)] bg-[var(--turquoise)]/15 text-[var(--turquoise)] shadow-[0_0_20px_-6px_var(--turquoise)]"
              : "border-white/10 bg-black/40 text-foreground/70 hover:bg-white/10",
          )}
        >
          <RefreshCw className={cn("size-5", autoplay && "animate-spin")} />
          <span className="text-[9px] uppercase tracking-wider">Auto</span>
        </button>

        {/* Paytable */}
        <button
          type="button"
          onClick={onOpenPaytable}
          aria-label="Voittotaulukko"
          className="flex size-[60px] flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-black/40 text-foreground/70 transition hover:bg-white/10 active:scale-95"
        >
          <BookOpen className="size-5" />
          <span className="text-[9px] uppercase tracking-wider">Säännöt</span>
        </button>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
  accent,
}: {
  label: string
  value: string
  highlight?: boolean
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-2">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
        {label}
      </p>
      <p
        className={cn(
          "font-heading text-base font-bold tabular-nums sm:text-xl",
          highlight && "gold-text",
          accent && "text-[var(--turquoise)]",
          !highlight && !accent && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}

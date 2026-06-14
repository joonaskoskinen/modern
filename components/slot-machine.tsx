"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  spin as runEngineSpin,
  INITIAL_GRID,
  countWays,
  formatCoins,
  type Grid,
} from "@/lib/slot-engine"
import { Reels } from "./reels"
import { ControlPanel } from "./control-panel"
import { WinBanner } from "./win-banner"
import { Paytable } from "./paytable"
import { BonusChamber } from "./bonus-chamber"
import { Coins } from "lucide-react"

const STORAGE_KEY = "eye-of-anubis-balance"
const START_BALANCE = 5000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Banner = { amount: number; tier: "big" | "mega" | "epic" } | null

export function SlotMachine() {
  const [balance, setBalance] = useState(START_BALANCE)
  const [bet, setBet] = useState(10)
  const [grid, setGrid] = useState<Grid>(INITIAL_GRID)
  const [winning, setWinning] = useState<Set<string>>(new Set())
  const [spinning, setSpinning] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [displayWin, setDisplayWin] = useState(0)
  const [ways, setWays] = useState(() => countWays(INITIAL_GRID))
  const [banner, setBanner] = useState<Banner>(null)
  const [bonusActive, setBonusActive] = useState(false)
  const [bonusBet, setBonusBet] = useState(10)
  const [showPaytable, setShowPaytable] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const mounted = useRef(true)
  const balanceRef = useRef(balance)
  const betRef = useRef(bet)
  const autoRef = useRef(autoplay)
  const busyRef = useRef(false)
  const runRef = useRef<() => void>(() => {})

  balanceRef.current = balance
  betRef.current = bet
  autoRef.current = autoplay

  // Load persisted balance
  useEffect(() => {
    mounted.current = true
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) setBalance(Math.max(0, Number(saved) || 0))
    } catch {}
    setHydrated(true)
    return () => {
      mounted.current = false
    }
  }, [])

  // Persist balance
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(balance)))
    } catch {}
  }, [balance, hydrated])

  const runSpin = useCallback(async () => {
    if (busyRef.current) return
    if (balanceRef.current < betRef.current) {
      setAutoplay(false)
      return
    }
    busyRef.current = true
    const stake = betRef.current

    setBalance((b) => +(b - stake).toFixed(2))
    setBanner(null)
    setWinning(new Set())
    setDisplayWin(0)
    setSpinning(true)

    const result = runEngineSpin(stake)
    setWays(result.ways)

    await sleep(720)
    if (!mounted.current) return
    setSpinning(false)

    let running = 0
    for (const step of result.steps) {
      if (!mounted.current) return
      setGrid(step.grid)
      setWinning(new Set())
      setDropping(true)
      await sleep(440)
      setDropping(false)
      if (step.wins.length > 0) {
        setWinning(new Set(step.cleared.map(([r, c]) => `${r}:${c}`)))
        running = +(running + step.stepWin).toFixed(2)
        setDisplayWin(running)
        await sleep(950)
        if (!mounted.current) return
        setWinning(new Set())
        await sleep(140)
      }
    }

    const totalWin = result.totalWin
    if (totalWin > 0) setBalance((b) => +(b + totalWin).toFixed(2))

    const ratio = totalWin / stake
    if (ratio >= 10) {
      setBanner({
        amount: totalWin,
        tier: ratio >= 50 ? "epic" : ratio >= 25 ? "mega" : "big",
      })
      await sleep(2300)
      if (mounted.current) setBanner(null)
    }

    if (result.triggeredBonus) {
      setBonusBet(stake)
      setBonusActive(true)
      // bonus completion resumes the flow
      return
    }

    busyRef.current = false
    if (autoRef.current && balanceRef.current >= betRef.current) {
      await sleep(450)
      if (mounted.current) runRef.current()
    } else if (balanceRef.current < betRef.current) {
      setAutoplay(false)
    }
  }, [])

  runRef.current = runSpin

  const handleBonusComplete = useCallback((winCoins: number) => {
    setBonusActive(false)
    if (winCoins > 0) {
      setBalance((b) => +(b + winCoins).toFixed(2))
      const ratio = winCoins / betRef.current
      if (ratio >= 10) {
        setBanner({
          amount: winCoins,
          tier: ratio >= 50 ? "epic" : ratio >= 25 ? "mega" : "big",
        })
        setTimeout(() => mounted.current && setBanner(null), 2300)
      }
    }
    busyRef.current = false
    if (autoRef.current && balanceRef.current >= betRef.current) {
      setTimeout(() => mounted.current && runRef.current(), 600)
    }
  }, [])

  const toggleAuto = useCallback(() => {
    setAutoplay((prev) => {
      const next = !prev
      autoRef.current = next
      if (next && !busyRef.current && balanceRef.current >= betRef.current) {
        setTimeout(() => runRef.current(), 50)
      }
      return next
    })
  }, [])

  const addCoins = () => setBalance((b) => b + START_BALANCE)

  const canSpin = !spinning && !dropping && !bonusActive && balance >= bet && !busyRef.current
  const lowFunds = balance < bet

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Atmospheric background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg-temple.png)" }}
      />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-background/70" />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, oklch(0.82 0.14 85 / 0.10), transparent 55%)",
        }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-3 py-5 sm:px-4 sm:py-7">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-3xl leading-none text-gold drop-shadow-[0_0_12px_rgba(231,184,80,0.5)]">
              𓂀
            </span>
            <div>
              <h1 className="gold-text font-heading text-lg font-extrabold leading-tight tracking-wide sm:text-2xl">
                Eye of Anubis
              </h1>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--turquoise)] sm:text-xs">
                Megaways
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] tracking-wider text-muted-foreground sm:text-xs">
            117 649 tapaa
          </span>
        </header>

        {/* Reel board */}
        <section className="relative flex flex-1 items-center justify-center">
          <div className="relative w-full rounded-2xl border border-[var(--gold)]/25 bg-black/40 p-2.5 panel-glow backdrop-blur-sm sm:p-4">
            {/* corner ornaments */}
            <span className="pointer-events-none absolute left-2 top-2 font-heading text-sm text-gold/50">
              𓋹
            </span>
            <span className="pointer-events-none absolute right-2 top-2 font-heading text-sm text-gold/50">
              𓋹
            </span>
            <div className="flex justify-center">
              <Reels
                grid={grid}
                winningPositions={winning}
                spinning={spinning}
                dropping={dropping}
              />
            </div>

            {/* Win pill */}
            {displayWin > 0 && (
              <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2">
                <div className="animate-pop rounded-full border border-[var(--gold)]/50 bg-card px-5 py-1.5 panel-glow">
                  <span className="gold-text font-heading text-base font-extrabold tabular-nums sm:text-lg">
                    +{formatCoins(displayWin)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <section className="mt-6">
          {lowFunds && !spinning && !bonusActive ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--gold)]/30 bg-card/80 p-3 panel-glow">
              <p className="text-sm text-muted-foreground">
                Kolikot loppuivat. Hae lisää leikkikolikoita ja jatka peliä.
              </p>
              <button
                type="button"
                onClick={addCoins}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 font-heading text-sm font-bold text-[var(--primary-foreground)] transition hover:bg-[var(--gold-soft)]"
              >
                <Coins className="size-4" />
                +{formatCoins(START_BALANCE)}
              </button>
            </div>
          ) : null}

          <ControlPanel
            balance={balance}
            bet={bet}
            lastWin={displayWin}
            ways={ways}
            spinning={spinning}
            canSpin={canSpin}
            autoplay={autoplay}
            onBetChange={setBet}
            onSpin={() => runRef.current()}
            onToggleAuto={toggleAuto}
            onOpenPaytable={() => setShowPaytable(true)}
          />
          <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
            Vain viihdekäyttöön · Leikkikolikoilla · Ei oikeaa rahaa
          </p>
        </section>
      </div>

      {banner && <WinBanner amount={banner.amount} tier={banner.tier} />}
      {showPaytable && <Paytable onClose={() => setShowPaytable(false)} />}
      {bonusActive && <BonusChamber bet={bonusBet} onComplete={handleBonusComplete} />}
    </main>
  )
}

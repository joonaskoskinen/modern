"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  spin as runEngineSpin,
  INITIAL_GRID,
  countWays,
  formatCoins,
  REELS,
  type Grid,
} from "@/lib/slot-engine"
import { Reels } from "./reels"
import { ControlPanel } from "./control-panel"
import { WinBanner } from "./win-banner"
import { Paytable } from "./paytable"
import { BonusChamber } from "./bonus-chamber"
import { Atmosphere } from "./atmosphere"
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
  const [stoppedReels, setStoppedReels] = useState(REELS)
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
    setStoppedReels(0)
    setSpinning(true)

    const result = runEngineSpin(stake)
    setWays(result.ways)
    // The board the reels will land on (first cascade step = raw spin result).
    setGrid(result.steps[0].grid)

    // Spin-up before the leftmost reel begins to stop.
    await sleep(420)
    if (!mounted.current) return

    // Stop reels one at a time, left → right, like a classic fruit machine.
    for (let r = 1; r <= REELS; r++) {
      setStoppedReels(r)
      await sleep(r === REELS ? 200 : 150)
      if (!mounted.current) return
    }
    setSpinning(false)
    await sleep(120)
    if (!mounted.current) return

    let running = 0
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i]
      if (!mounted.current) return
      // Step 0 is already on screen (the reels just landed on it), so we
      // only run the drop animation for subsequent cascade steps.
      if (i > 0) {
        setGrid(step.grid)
        setWinning(new Set())
        setDropping(true)
        await sleep(440)
        setDropping(false)
      }
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
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <Atmosphere />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-3 py-4 sm:px-5 sm:py-6 lg:py-8">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-black/40 shadow-[0_0_20px_-4px_rgba(231,184,80,0.6)] sm:size-12">
              <img
                src="/sym-eye.png"
                alt="Eye of Anubis -tunnus"
                className="size-7 object-contain drop-shadow-[0_0_8px_rgba(231,184,80,0.5)] sm:size-8"
                draggable={false}
              />
            </span>
            <div>
              <h1 className="gold-text font-heading text-xl font-extrabold leading-none tracking-wide sm:text-3xl">
                Eye of Anubis
              </h1>
              <p className="mt-1 text-[10px] uppercase tracking-emblem text-[var(--turquoise)] sm:text-xs">
                Megaways · Cascading Reels
              </p>
            </div>
          </div>
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Saldo
            </span>
            <span className="gold-text font-heading text-xl font-bold tabular-nums">
              {formatCoins(balance)}
            </span>
          </div>
          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] tracking-wider text-muted-foreground sm:hidden">
            117 649 tapaa
          </span>
        </header>

        {/* Reel board */}
        <section className="relative flex flex-1 items-center justify-center">
          <div className="glass relative w-full rounded-[1.75rem] border border-[var(--gold)]/30 p-3 panel-glow sm:p-5 lg:p-6">
            {/* top engraved title plate */}
            <div className="mb-3 flex items-center justify-center gap-3 sm:mb-4">
              <span className="h-px w-10 rule-gold sm:w-16" />
              <span className="font-heading text-[10px] uppercase tracking-emblem text-gold/80 sm:text-xs">
                {formatCoins(ways)} tapaa voittaa
              </span>
              <span className="h-px w-10 rule-gold sm:w-16" />
            </div>

            {/* corner ornaments */}
            <span className="pointer-events-none absolute left-2.5 top-2.5 size-2 rotate-45 border border-gold/60 bg-gold/10 sm:left-3 sm:top-3" />
            <span className="pointer-events-none absolute right-2.5 top-2.5 size-2 rotate-45 border border-gold/60 bg-gold/10 sm:right-3 sm:top-3" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 size-2 rotate-45 border border-gold/50 bg-gold/10 sm:bottom-3 sm:left-3" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 size-2 rotate-45 border border-gold/50 bg-gold/10 sm:bottom-3 sm:right-3" />

            <div className="flex justify-center">
              <Reels
                grid={grid}
                winningPositions={winning}
                spinning={spinning}
                dropping={dropping}
                stoppedReels={stoppedReels}
              />
            </div>

            {/* Win pill */}
            {displayWin > 0 && (
              <div className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2">
                <div className="animate-pop flex items-center gap-2 rounded-full border border-[var(--gold)]/60 bg-card px-6 py-2 panel-glow">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--turquoise)]">
                    Voitto
                  </span>
                  <span className="gold-text font-heading text-lg font-extrabold tabular-nums sm:text-xl">
                    +{formatCoins(displayWin)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <section className="mt-7 sm:mt-8">
          {lowFunds && !spinning && !bonusActive ? (
            <div className="glass mb-3 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[var(--gold)]/30 p-3 panel-glow sm:flex-row">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Kolikot loppuivat. Hae lisää leikkikolikoita ja jatka peliä.
              </p>
              <button
                type="button"
                onClick={addCoins}
                className="sheen flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 font-heading text-sm font-bold text-[var(--primary-foreground)] transition hover:bg-[var(--gold-soft)] sm:w-auto"
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
          <p className="mt-3 text-center text-[10px] leading-relaxed tracking-wide text-muted-foreground">
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

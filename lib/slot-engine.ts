// Eye of Anubis — Megaways slot engine
// Pure, framework-agnostic game logic.

export type SymbolId =
  | "book" // scatter / wild
  | "pharaoh"
  | "anubis"
  | "scarab"
  | "eye"
  | "A"
  | "K"
  | "Q"
  | "J"
  | "T"

export interface SymbolDef {
  id: SymbolId
  label: string
  /** image path, or null for styled royal letters */
  image: string | null
  /** relative drawing weight on the reels */
  weight: number
  /** payout multiplier on the *bet* for 3 / 4 / 5 / 6 of a kind */
  pays: [number, number, number, number]
  tier: "scatter" | "high" | "low"
}

export const SCATTER: SymbolId = "book"
export const REELS = 6
export const MIN_ROWS = 2
export const MAX_ROWS = 7

/**
 * Global multiplier applied to every line payout. This is the single knob
 * used to tune base-game RTP. Calibrated via Monte Carlo simulation so the
 * combined (base + bonus) RTP lands at ~95%.
 */
export const PAY_SCALE = 0.224

export const SYMBOLS: Record<SymbolId, SymbolDef> = {
  book: {
    id: "book",
    label: "Anubiksen kirja",
    image: "/sym-book.png",
    weight: 3,
    pays: [2, 8, 20, 50],
    tier: "scatter",
  },
  pharaoh: {
    id: "pharaoh",
    label: "Faarao",
    image: "/sym-pharaoh.png",
    weight: 10,
    pays: [1, 4, 12, 30],
    tier: "high",
  },
  anubis: {
    id: "anubis",
    label: "Anubis",
    image: "/sym-anubis.png",
    weight: 12,
    pays: [0.8, 3, 9, 22],
    tier: "high",
  },
  scarab: {
    id: "scarab",
    label: "Skarabee",
    image: "/sym-scarab.png",
    weight: 14,
    pays: [0.6, 2, 6, 15],
    tier: "high",
  },
  eye: {
    id: "eye",
    label: "Horuksen silmä",
    image: "/sym-eye.png",
    weight: 16,
    pays: [0.5, 1.5, 5, 12],
    tier: "high",
  },
  A: { id: "A", label: "Ässä", image: null, weight: 20, pays: [0.3, 1, 3, 7], tier: "low" },
  K: { id: "K", label: "Kuningas", image: null, weight: 22, pays: [0.25, 0.8, 2.5, 6], tier: "low" },
  Q: { id: "Q", label: "Kuningatar", image: null, weight: 24, pays: [0.2, 0.6, 2, 5], tier: "low" },
  J: { id: "J", label: "Jätkä", image: null, weight: 26, pays: [0.15, 0.5, 1.5, 4], tier: "low" },
  T: { id: "T", label: "Kymppi", image: null, weight: 28, pays: [0.1, 0.4, 1.2, 3], tier: "low" },
}

const NON_SCATTER: SymbolId[] = ["pharaoh", "anubis", "scarab", "eye", "A", "K", "Q", "J", "T"]

// Weighted pool builders -------------------------------------------------

function weightedPick(pool: SymbolId[]): SymbolId {
  return pool[Math.floor(Math.random() * pool.length)]
}

function buildPool(includeScatter: boolean): SymbolId[] {
  const pool: SymbolId[] = []
  for (const id of Object.keys(SYMBOLS) as SymbolId[]) {
    if (id === SCATTER && !includeScatter) continue
    const w = SYMBOLS[id].weight
    for (let i = 0; i < w; i++) pool.push(id)
  }
  return pool
}

const SPIN_POOL = buildPool(true)
const REFILL_POOL = buildPool(false) // scatters do not refill during cascades

// Grid types -------------------------------------------------------------

export type Grid = SymbolId[][] // [reel][row]

export interface WinLine {
  symbol: SymbolId
  reels: number // number of consecutive reels (>=3)
  ways: number // product of occurrences per reel
  amount: number
  positions: Array<[number, number]> // [reel, row]
}

export interface CascadeStep {
  grid: Grid
  wins: WinLine[]
  stepWin: number
  /** positions cleared after this step's wins (for animation) */
  cleared: Array<[number, number]>
}

export interface SpinResult {
  steps: CascadeStep[]
  totalWin: number
  ways: number
  scatterCount: number
  triggeredBonus: boolean
  rowsPerReel: number[]
}

function randomRows(): number {
  // Slightly favour the middle of the 2..7 range.
  const r = Math.random()
  if (r < 0.12) return 2
  if (r < 0.34) return 3
  if (r < 0.62) return 4
  if (r < 0.82) return 5
  if (r < 0.94) return 6
  return 7
}

/**
 * A fixed, deterministic starting board so server and client render
 * identical markup on first paint (no hydration mismatch). The first
 * random grid is generated only after the user spins.
 */
export const INITIAL_GRID: Grid = [
  ["anubis", "eye", "book", "eye"],
  ["Q", "Q", "Q", "A"],
  ["Q", "A", "T", "Q"],
  ["T", "A", "K", "scarab"],
  ["eye", "J", "pharaoh", "Q"],
  ["A", "T", "scarab", "scarab", "book"],
]

export function makeGrid(rowsPerReel: number[]): Grid {
  return rowsPerReel.map((rows) => {
    const col: SymbolId[] = []
    for (let r = 0; r < rows; r++) col.push(weightedPick(SPIN_POOL))
    return col
  })
}

export function countWays(grid: Grid): number {
  return grid.reduce((acc, col) => acc * col.length, 1)
}

function countScatters(grid: Grid): number {
  let n = 0
  for (const col of grid) for (const s of col) if (s === SCATTER) n++
  return n
}

// Megaways win evaluation: matching symbols on consecutive reels from the left.
export function evaluate(grid: Grid, bet: number): WinLine[] {
  const wins: WinLine[] = []
  for (const sym of NON_SCATTER) {
    let reelsHit = 0
    let ways = 1
    const positions: Array<[number, number]> = []
    for (let reel = 0; reel < grid.length; reel++) {
      const rowsWith: number[] = []
      grid[reel].forEach((s, row) => {
        if (s === sym) rowsWith.push(row)
      })
      if (rowsWith.length === 0) break
      reelsHit++
      ways *= rowsWith.length
      rowsWith.forEach((row) => positions.push([reel, row]))
    }
    if (reelsHit >= 3) {
      const pay = SYMBOLS[sym].pays[Math.min(reelsHit, 6) - 3]
      const amount = +(pay * PAY_SCALE * ways * bet).toFixed(2)
      if (amount > 0) {
        wins.push({ symbol: sym, reels: reelsHit, ways, amount, positions })
      }
    }
  }
  return wins
}

// Remove winning positions, collapse columns, refill from the top.
function cascade(grid: Grid, cleared: Array<[number, number]>): Grid {
  const clearedSet = new Set(cleared.map(([r, c]) => `${r}:${c}`))
  return grid.map((col, reel) => {
    const survivors = col.filter((_, row) => !clearedSet.has(`${reel}:${row}`))
    const missing = col.length - survivors.length
    const fresh: SymbolId[] = []
    for (let i = 0; i < missing; i++) fresh.push(weightedPick(REFILL_POOL))
    // new symbols drop in from the top
    return [...fresh, ...survivors]
  })
}

export function spin(bet: number): SpinResult {
  const rowsPerReel = Array.from({ length: REELS }, randomRows)
  let grid = makeGrid(rowsPerReel)
  const ways = countWays(grid)
  const scatterCount = countScatters(grid)

  const steps: CascadeStep[] = []
  let totalWin = 0
  let guard = 0

  while (guard++ < 12) {
    const wins = evaluate(grid, bet)
    const stepWin = +wins.reduce((a, w) => a + w.amount, 0).toFixed(2)
    if (wins.length === 0) {
      steps.push({ grid, wins: [], stepWin: 0, cleared: [] })
      break
    }
    const cleared = wins.flatMap((w) => w.positions)
    steps.push({ grid, wins, stepWin, cleared })
    totalWin = +(totalWin + stepWin).toFixed(2)
    grid = cascade(grid, cleared)
  }

  return {
    steps,
    totalWin,
    ways,
    scatterCount,
    triggeredBonus: scatterCount >= 3,
    rowsPerReel,
  }
}

// ---------------------------------------------------------------------------
// Pick & Win — Treasure Chamber bonus
// ---------------------------------------------------------------------------

export type ChestKind = "coin" | "exit"

export interface Chest {
  id: number
  kind: ChestKind
  /** multiplier of the triggering bet (coin chests only) */
  multiplier: number
  revealed: boolean
}

export interface BonusState {
  chests: Chest[]
  picks: Array<{ id: number; kind: ChestKind; multiplier: number }>
  collected: number // multiplier sum
  finished: boolean
}

const COIN_MULTIPLIERS = [2, 3, 4, 5, 5, 8, 10, 12, 15, 20, 25, 40]

export function createBonus(): BonusState {
  const total = 12
  const exits = 3 // three "exit" chests end the round
  const kinds: ChestKind[] = []
  for (let i = 0; i < exits; i++) kinds.push("exit")
  for (let i = 0; i < total - exits; i++) kinds.push("coin")
  // shuffle
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kinds[i], kinds[j]] = [kinds[j], kinds[i]]
  }
  const coinValues = [...COIN_MULTIPLIERS]
  // shuffle coin values too
  for (let i = coinValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[coinValues[i], coinValues[j]] = [coinValues[j], coinValues[i]]
  }
  let ci = 0
  const chests: Chest[] = kinds.map((kind, id) => ({
    id,
    kind,
    multiplier: kind === "coin" ? coinValues[ci++] : 0,
    revealed: false,
  }))
  return { chests, picks: [], collected: 0, finished: false }
}

export function pickChest(state: BonusState, id: number): BonusState {
  if (state.finished) return state
  const chest = state.chests.find((c) => c.id === id)
  if (!chest || chest.revealed) return state

  const chests = state.chests.map((c) => (c.id === id ? { ...c, revealed: true } : c))
  const picks = [...state.picks, { id, kind: chest.kind, multiplier: chest.multiplier }]
  const finished = chest.kind === "exit"
  const collected =
    chest.kind === "coin" ? +(state.collected + chest.multiplier).toFixed(2) : state.collected

  return { chests, picks, collected, finished }
}

export function formatCoins(n: number): string {
  return Math.round(n).toLocaleString("fi-FI")
}

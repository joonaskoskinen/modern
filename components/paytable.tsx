"use client"

import { useEffect } from "react"
import { SYMBOLS, type SymbolId } from "@/lib/slot-engine"
import { X } from "lucide-react"

const ORDER: SymbolId[] = ["book", "pharaoh", "anubis", "scarab", "eye", "A", "K", "Q", "J", "T"]

const ROYAL_TINT: Record<string, string> = {
  A: "oklch(0.78 0.13 25)",
  K: "oklch(0.74 0.11 190)",
  Q: "oklch(0.7 0.12 145)",
  J: "oklch(0.72 0.13 60)",
  T: "oklch(0.7 0.1 250)",
}

export function Paytable({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass animate-banner relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--gold)]/35 p-5 panel-glow sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Sulje"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-foreground/70 transition hover:bg-white/10"
        >
          <X className="size-5" />
        </button>

        <p className="font-heading text-xs uppercase tracking-emblem text-[var(--turquoise)]">
          Voittotaulukko
        </p>
        <h2 className="gold-text font-heading text-2xl font-extrabold sm:text-3xl">Eye of Anubis</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          117 649 tapaa voittaa. Samat symbolit peräkkäisillä rullilla vasemmalta lukien.
          Kertoimet ovat panoksen kerrannaisia (3× / 4× / 5× / 6× symbolia).
        </p>

        <div className="mt-4 space-y-1.5">
          {ORDER.map((id) => {
            const def = SYMBOLS[id]
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition hover:border-[var(--gold)]/30"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">
                  {def.image ? (
                    <img src={def.image || "/placeholder.svg"} alt={def.label} className="h-9 w-9 object-contain" />
                  ) : (
                    <span
                      className="font-heading text-xl font-extrabold"
                      style={{ color: ROYAL_TINT[id] }}
                    >
                      {id === "T" ? "10" : id}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold text-foreground">{def.label}</p>
                  {def.tier === "scatter" && (
                    <p className="text-[11px] text-[var(--turquoise)]">
                      Scatter — 3+ avaa Aarrekammion
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 font-mono text-xs tabular-nums">
                  {def.pays.map((p, i) => (
                    <span
                      key={i}
                      className="rounded bg-white/[0.06] px-1.5 py-1 text-foreground/80"
                    >
                      {p}×
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/[0.06] p-3">
          <p className="font-heading text-sm font-bold text-gold">Aarrekammio (Pick &amp; Win)</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Kolme tai useampi Anubiksen kirja avaa bonuspelin. Avaa arkkuja ja kerää
            kolikoita kunnes paljastat sinetin. Suurin yksittäinen arkku 40× panos.
          </p>
        </div>
      </div>
    </div>
  )
}

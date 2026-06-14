"use client"

import { useMemo } from "react"

/**
 * Ambient temple atmosphere: a layered vignette, a warm light shaft and a
 * field of slowly drifting golden dust motes. Purely decorative — sits behind
 * the game board and never intercepts pointer events.
 */
export function Atmosphere() {
  // Deterministic-ish mote field generated once per mount.
  const motes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.round((i * 37.5) % 100),
        size: 1 + (i % 4),
        delay: (i % 9) * 1.1,
        dur: 8 + (i % 6) * 1.6,
        drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 8),
        opacity: 0.18 + (i % 5) * 0.08,
      })),
    [],
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Temple photograph */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg-temple.png)" }}
      />
      {/* Darkening + warm grade */}
      <div className="absolute inset-0 bg-background/78" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% -10%, oklch(0.83 0.14 85 / 0.16), transparent 55%)",
        }}
      />
      {/* Soft light shaft from above */}
      <div
        className="absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2 opacity-60 blur-2xl"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, transparent 42%, oklch(0.83 0.14 85 / 0.1) 50%, transparent 58%)",
        }}
      />
      {/* Bottom vignette to anchor controls */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, oklch(0.12 0.02 255 / 0.92), transparent)",
        }}
      />

      {/* Drifting dust motes */}
      {motes.map((m) => (
        <span
          key={m.id}
          className="animate-drift absolute bottom-0 rounded-full bg-[var(--gold)]"
          style={
            {
              left: `${m.left}%`,
              width: m.size,
              height: m.size,
              animationDelay: `${m.delay}s`,
              "--mote-dur": `${m.dur}s`,
              "--mote-x": `${m.drift}px`,
              "--mote-opacity": m.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Timer } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"


/** "4'" → 240, "90''" → 90. Descanso a segundos. */
function restToSeconds(rest: string): number {
  const n = parseInt(rest.replace(/\D/g, ""), 10)
  if (Number.isNaN(n)) return 0
  return rest.includes("''") ? n : n * 60
}

/** Segundos → "M:SS". */
function fmtClock(total: number): string {
  const t = Math.max(0, total)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`
}

/**
 * Temporizador de descanso con cuenta regresiva. Se monta al entrar al descanso
 * y arranca solo desde la duración del ejercicio; `−15s` resta, `seguir` corta,
 * y al llegar a 0 avisa con onDone. Compacto: vive en el pie fijo.
 */
export function RestTimer({
  rest,
  onSkip,
  onDone,
}: {
  rest: string
  onSkip: () => void
  onDone: () => void
}) {
  const total = restToSeconds(rest)
  const [left, setLeft] = useState(total)

  // Un solo intervalo mientras está montado; el functional update evita relanzarlo.
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // Al llegar a 0, cerrar el descanso (desmonta el timer).
  useEffect(() => {
    if (left === 0) onDone()
  }, [left, onDone])

  const pct = total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0

  return (
    <div className="fade-up overflow-hidden rounded-2xl border border-edge bg-surface">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="text-primary">
          <Timer className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Eyebrow as="p" size="sm" className="font-semibold text-primary">
            Descanso
          </Eyebrow>
          <p className="font-display text-[22px] leading-none tabular-nums text-foreground">
            {fmtClock(left)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLeft((s) => Math.max(0, s - 15))}
          className="h-11 shrink-0 cursor-pointer rounded-full border border-edge px-3 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:border-primary hover:text-foreground"
        >
          −15s
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="h-11 shrink-0 cursor-pointer rounded-full border border-primary bg-surface-raised px-3.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-primary uppercase transition-colors hover:bg-accent"
        >
          Seguir
        </button>
      </div>
      {/* Barra que drena con el tiempo */}
      <div className="h-1 w-full bg-hairline">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

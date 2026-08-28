"use client"

import Link from "next/link"
import { ArrowRight, Check, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RestTimer } from "./rest-timer"
import { slotTitle, type Slot } from "./slots"

/**
 * Pie fijo, con tres caras excluyentes: cargando (CTA + omitir), descansando
 * (el temporizador ocupa el lugar del CTA) y ejercicio cerrado (salto al
 * siguiente). Los tres miden lo mismo, así que nada salta al alternarse.
 */
export function ActionBar({
  resting,
  allClosed,
  restSeconds,
  unit,
  canComplete,
  next,
  nextHref,
  onComplete,
  onSkip,
  onReset,
  onRestEnd,
}: {
  resting: boolean
  allClosed: boolean
  restSeconds: number
  unit: string
  canComplete: boolean
  next?: Slot
  nextHref: string
  onComplete: () => void
  onSkip: () => void
  onReset: () => void
  onRestEnd: () => void
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-auto border-t border-edge bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {resting ? (
        <RestTimer seconds={restSeconds} onSkip={onRestEnd} onDone={onRestEnd} />
      ) : allClosed ? (
        <div className="flex items-center gap-3">
          <Button
            asChild
            className="h-14 flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase"
          >
            <Link href={nextHref}>
              <span className="truncate">
                {next ? `Siguiente · ${next.num} ${slotTitle(next)}` : "Terminar el día"}
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <button
            type="button"
            aria-label="Reiniciar ejercicio"
            onClick={onReset}
            className="inline-flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-edge text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            onClick={onComplete}
            disabled={!canComplete}
            className="h-14 min-w-0 flex-1 text-[12px] font-semibold tracking-[0.16em] uppercase"
          >
            <Check className="size-4" />
            <span className="truncate">Completar {unit}</span>
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="h-14 shrink-0 cursor-pointer rounded-lg border border-edge px-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:border-primary hover:text-foreground"
          >
            Omitir
          </button>
        </div>
      )}
    </div>
  )
}

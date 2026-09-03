"use client"

import Link from "next/link"
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RestTimer } from "./rest-timer"
import { slotTitle, type Slot } from "./slots"

/**
 * Pie fijo, con tres caras excluyentes: cargando (CTA + omitir), descansando
 * (el temporizador ocupa el lugar del CTA) y ejercicio cerrado (salto al
 * siguiente). Los tres miden lo mismo, así que nada salta al alternarse.
 *
 * En el ÚLTIMO ejercicio el salto se convierte en acción: terminar el día
 * cierra la sesión contra la API en vez de solo volver a `/rutina`. Es el
 * momento en que lo cargado deja de ser parcial y pasa a ser historial
 * comparable, así que tiene que ser un gesto y no un efecto de navegar.
 */
export function ActionBar({
  resting,
  allClosed,
  restSeconds,
  unit,
  canComplete,
  next,
  nextHref,
  finishing,
  onComplete,
  onSkip,
  onReset,
  onRestEnd,
  onFinish,
}: {
  resting: boolean
  allClosed: boolean
  restSeconds: number
  unit: string
  canComplete: boolean
  next?: Slot
  nextHref: string
  /** El cierre de la sesión está en vuelo. */
  finishing: boolean
  onComplete: () => void
  onSkip: () => void
  onReset: () => void
  onRestEnd: () => void
  /** Cierra la sesión y, si sale bien, sale de la pantalla. */
  onFinish: () => void
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-auto border-t border-edge bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {resting ? (
        <RestTimer seconds={restSeconds} onSkip={onRestEnd} onDone={onRestEnd} />
      ) : allClosed ? (
        <div className="flex items-center gap-3">
          {next ? (
            <Button
              asChild
              className="h-14 flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase"
            >
              <Link href={nextHref}>
                <span className="truncate">
                  Siguiente · {next.num} {slotTitle(next)}
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button
              onClick={onFinish}
              disabled={finishing}
              className="h-14 flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase"
            >
              {finishing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              <span className="truncate">Terminar el día</span>
            </Button>
          )}
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

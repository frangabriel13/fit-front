import Link from "next/link"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"

import { slotState, slotTitle, type Slot } from "./slots"

/** Saltar al ejercicio anterior/siguiente, y reiniciar el actual. */
export function ExerciseNav({
  prev,
  next,
  onReset,
}: {
  prev?: Slot
  next?: Slot
  onReset: () => void
}) {
  return (
    <div className="fade-up mt-5 border-t border-hairline pt-5 [--delay:280ms]">
      <div className="flex items-center justify-between gap-4 font-mono text-[11px] tracking-[0.14em] uppercase">
        {prev ? (
          <Link
            href="/rutina/entrenar"
            className="group inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="truncate">
              {prev.num} {slotTitle(prev)}
            </span>
            {slotState(prev) === "done" && (
              <span className="shrink-0 text-muted-foreground">✓</span>
            )}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href="/rutina/entrenar"
            className="group inline-flex min-w-0 items-center gap-2 text-right text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="truncate">
              {next.num} {slotTitle(next)}
            </span>
            <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span />
        )}
      </div>
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-faint uppercase transition-colors hover:text-destructive"
        >
          <RotateCcw className="size-3" />
          Reiniciar ejercicio
        </button>
      </div>
    </div>
  )
}

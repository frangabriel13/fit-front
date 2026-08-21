import { ArrowRight } from "lucide-react"

import { MACROCYCLE } from "@/lib/routine-data"
import type { HistSet } from "@/lib/training-math"
import { cn } from "@/lib/utils"
import type { Draft } from "./types"

/**
 * La semana anterior y lo de hoy, lado a lado y siempre a la vista. La columna
 * izquierda ES el botón para igualar lo de la semana pasada: la comparación no
 * sirve de nada si copiarla cuesta cuatro toques.
 */
export function CompareStrip({
  refSet,
  refE1rm,
  liveE1rm,
  e1rmDelta,
  draft,
  unit,
  round,
  rounds,
  memberLetter,
  onMatch,
}: {
  refSet: HistSet | null
  refE1rm: number | null
  liveE1rm: number | null
  e1rmDelta: number | null
  draft: Draft
  unit: string
  round: number
  rounds: number
  memberLetter?: string
  onMatch: (weight: number, reps: number) => void
}) {
  return (
    <section
      className={cn(
        "fade-up items-stretch gap-3 [--delay:80ms]",
        refSet && "grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]"
      )}
    >
      {refSet && (
        <>
          <button
            type="button"
            aria-label="Igualar la semana anterior"
            onClick={() => onMatch(refSet.weight, refSet.reps)}
            className="flex cursor-pointer flex-col gap-1 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-left transition-colors hover:border-edge"
          >
            <span className="font-mono text-[9px] tracking-[0.18em] text-faint uppercase">
              Semana {MACROCYCLE.week - 1}
            </span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {refSet.weight} kg × {refSet.reps}
            </span>
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[9px] tabular-nums text-faint">
                1RM {refE1rm}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-primary uppercase">
                <ArrowRight className="size-2.5" strokeWidth={2.5} />
                igualar
              </span>
            </span>
          </button>

          <span aria-hidden className="bg-hairline" />
        </>
      )}

      <div className="flex flex-col gap-1 py-2.5">
        <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-primary uppercase">
          Hoy · {unit} {round + 1}/{rounds}
          {memberLetter && ` — ${memberLetter}`}
        </span>
        <span className="font-mono text-sm tabular-nums text-foreground">
          {draft.weight || "—"} kg × {draft.reps || "—"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] tabular-nums text-faint">
            1RM {liveE1rm ?? "—"}
          </span>
          {e1rmDelta != null && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                e1rmDelta > 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-raised text-muted-foreground"
              )}
            >
              {e1rmDelta > 0 ? `+${e1rmDelta}` : e1rmDelta === 0 ? "=" : e1rmDelta}
            </span>
          )}
        </span>
      </div>
    </section>
  )
}

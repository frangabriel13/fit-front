"use client"

import { useState } from "react"

import { ProgressionRail } from "@/components/routine/progression-rail"
import { HISTORY, SESSION, type RoutineExercise } from "@/lib/routine-data"
import { cn } from "@/lib/utils"
import { DetailActions } from "./detail-actions"
import { setDelta } from "./set-delta"
import { SetLogList, type SetLine } from "./set-log-list"

/** Detalle expandido de una fila: series de hoy, comparación y acciones. */
export function RowDetail({ ex }: { ex: RoutineExercise }) {
  const logs =
    SESSION.logs[ex.name] ??
    Array.from({ length: ex.sets }, () => ({ status: "pending" as const }))
  const hist = HISTORY[ex.name]
  const prevWeek = hist?.weeks.at(-1) ?? null
  const hasPrev = prevWeek != null

  // Toggle de la planilla: "Hoy" (con delta vs. la semana pasada) o la
  // referencia cruda de la semana anterior, mismo formato. Una vista a la vez:
  // entra cómodo en mobile sin amontonar las dos columnas.
  const [view, setView] = useState<"today" | "prev">("today")
  const showPrev = view === "prev" && hasPrev

  const lines: SetLine[] =
    showPrev && prevWeek
      ? prevWeek.map((p, i) => ({
          n: i + 1,
          status: "done" as const,
          weight: p.weight,
          reps: p.reps,
          rir: p.rir,
        }))
      : logs.map((s, i) => ({
          n: i + 1,
          status: s.status,
          weight: s.weight,
          reps: s.reps,
          rir: s.rir,
          delta: s.status === "done" ? setDelta(s, prevWeek?.[i]) : null,
        }))

  return (
    <div className="fade-up border-t border-border bg-card px-4 py-5 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <section className="rounded-2xl bg-secondary p-4">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <button
              type="button"
              onClick={() => setView("today")}
              aria-pressed={!showPrev}
              className={cn(
                "cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors",
                !showPrev
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/55 hover:text-foreground"
              )}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setView("prev")}
              disabled={!hasPrev}
              aria-pressed={showPrev}
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors",
                showPrev
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/55 enabled:cursor-pointer enabled:hover:text-foreground disabled:opacity-35"
              )}
            >
              Sem. anterior
            </button>
          </div>

          <SetLogList key={showPrev ? "prev" : "today"} lines={lines} />
        </section>

        {hist && (
          <section className="rounded-2xl bg-secondary p-4">
            <ProgressionRail name={ex.name} />
          </section>
        )}
      </div>

      <DetailActions />
    </div>
  )
}

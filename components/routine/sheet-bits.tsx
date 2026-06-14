// Piezas compartidas del lenguaje "planilla": las usan el overview
// (routine-view) y el modo entrenamiento (/rutina/entrenar).

import { ArrowUp } from "lucide-react"

import {
  HISTORY,
  SESSION,
  topWeight,
  type RoutineExercise,
} from "@/lib/routine-data"
import { cn } from "@/lib/utils"

/** Abreviaturas de planilla: "10 a 12" → "10-12", "0 o fallo" → "0-F". */
export function sheet(value: string): string {
  return value.replace(" o fallo", "-F").replaceAll(" a ", "-")
}

// ─── numeración de planilla: superseries comparten número con sufijo A/B ────

export interface SheetItem {
  ex: RoutineExercise
  num: string
  letter?: string
  /** Primera(s) mitad(es) de una superserie: encadena sin pausa con la siguiente. */
  chains: boolean
}

export function toSheetItems(exercises: RoutineExercise[]): SheetItem[] {
  const items: SheetItem[] = []
  let i = 0
  let block = 0
  while (i < exercises.length) {
    block++
    const group = [exercises[i]]
    const ss = exercises[i].superset
    if (ss) {
      let k = i + 1
      while (k < exercises.length && exercises[k].superset === ss) {
        group.push(exercises[k])
        k++
      }
    }
    group.forEach((ex, j) => {
      items.push({
        ex,
        num: String(block).padStart(2, "0"),
        letter: group.length > 1 ? String.fromCharCode(65 + j) : undefined,
        chains: group.length > 1 && j < group.length - 1,
      })
    })
    i += group.length
  }
  return items
}

// ─── marca de tally por serie ────────────────────────────────────────────────

export function SetTally({
  status,
}: {
  status: "done" | "skipped" | "pending"
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-5 w-[3px] shrink-0 rounded-full",
        status === "done" && "bg-primary",
        status === "skipped" &&
          "bg-[repeating-linear-gradient(45deg,var(--color-muted-foreground)_0_2px,transparent_2px_4px)] opacity-50",
        status === "pending" && "bg-white/15"
      )}
    />
  )
}

// ─── riel de progresión: Sem 1 → Sem. ant. → Hoy ────────────────────────────

export function ProgressionRail({ name }: { name: string }) {
  const hist = HISTORY[name]
  if (!hist) return null

  const todayDone = (SESSION.logs[name] ?? []).filter(
    (s) => s.status === "done"
  )
  const todayTop = todayDone.length ? topWeight(todayDone) : null

  const nodes = [
    { key: "s1", label: "Sem 1", weight: topWeight(hist.firstWeek) },
    { key: "prev", label: "Sem. ant.", weight: topWeight(hist.lastWeek) },
    { key: "today", label: "Hoy", weight: todayTop, today: true },
  ]
  const baseWeight = topWeight(hist.firstWeek)
  const refWeight = todayTop ?? topWeight(hist.lastWeek)
  const gain =
    refWeight != null && baseWeight != null ? refWeight - baseWeight : null

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.24em] text-primary/90 uppercase">
          Progresión
        </p>
        <p className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground/55 uppercase">
          Top set
        </p>
      </div>

      <div className="mt-6">
        {/* etiquetas */}
        <div className="grid grid-cols-3">
          {nodes.map((n) => (
            <span
              key={n.key}
              className={cn(
                "text-center font-mono text-[9px] tracking-[0.16em] uppercase",
                n.today ? "text-primary" : "text-muted-foreground/80"
              )}
            >
              {n.label}
            </span>
          ))}
        </div>

        {/* riel con nodos */}
        <div className="relative my-2.5 grid grid-cols-3">
          <span
            aria-hidden
            className="absolute inset-x-0 top-1/2 mx-[16.66%] h-px -translate-y-1/2 bg-gradient-to-r from-white/15 via-primary/40 to-primary/70"
          />
          {nodes.map((n) => (
            <span key={n.key} className="flex justify-center">
              <span
                className={cn(
                  "relative size-2.5 rounded-full",
                  n.today && n.weight == null
                    ? "border border-dashed border-white/25 bg-background"
                    : n.today
                      ? "bg-primary shadow-[0_0_10px_-1px] shadow-primary/70 ring-2 ring-primary/25"
                      : "bg-foreground/30"
                )}
              />
            </span>
          ))}
        </div>

        {/* pesos */}
        <div className="grid grid-cols-3 items-baseline">
          {nodes.map((n) => (
            <span key={n.key} className="text-center">
              {n.weight != null ? (
                <span
                  className={cn(
                    n.today
                      ? "font-display text-2xl leading-none text-primary"
                      : "font-mono text-[13px] text-foreground/70"
                  )}
                >
                  {n.weight}
                  <span
                    className={cn(
                      n.today
                        ? "ml-0.5 text-xs text-primary/70"
                        : "text-muted-foreground"
                    )}
                  >
                    kg
                  </span>
                </span>
              ) : (
                <span className="font-mono text-[13px] text-muted-foreground/40">
                  —
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {gain != null && gain > 0 && (
        <div className="mt-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-primary">
            <ArrowUp className="size-3" strokeWidth={2.5} />+{gain} kg
          </span>
          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground/55 uppercase">
            desde la semana 1
          </span>
        </div>
      )}
    </section>
  )
}

// Piezas compartidas del lenguaje "planilla": las usan el overview
// (routine-view) y el modo entrenamiento (/rutina/entrenar).

import { ArrowDown, ArrowUp, Minus } from "lucide-react"

import {
  HISTORY,
  MACROCYCLE,
  SESSION,
  topE1RM,
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
  const todayTop = todayDone.length ? topE1RM(todayDone) : null

  // Un nodo por semana del macrociclo. El valor es el 1RM estimado (e1RM):
  // combina peso y reps, así "mismo peso, más reps" también sube la barra.
  const nodes = Array.from({ length: MACROCYCLE.totalWeeks }, (_, i) => {
    const week = i + 1
    const past = hist.weeks[i]
    const today = week === MACROCYCLE.week
    const value = past ? topE1RM(past) : today ? todayTop : null
    return { week, value, today, future: week > MACROCYCLE.week }
  })

  const values = nodes
    .map((n) => n.value)
    .filter((v): v is number => v != null)
  const max = values.length ? Math.max(...values) : 0
  // Línea base a la mitad del máximo: una progresión real trepa, pero las
  // mesetas quedan parejas en vez de exagerar el ruido semana a semana.
  const heightPct = (v: number) => {
    if (max <= 0) return 70
    const baseline = max * 0.5
    return Math.max(12, Math.min(100, ((v - baseline) / (max - baseline)) * 100))
  }

  const base = nodes[0]?.value ?? null
  const ref = todayTop ?? topE1RM(hist.weeks.at(-1) ?? [])
  const gain = ref != null && base != null ? Math.round(ref - base) : null
  // Estado del tramo, sin connotación de alarma en mesetas o mermas.
  const trend = gain == null ? null : gain >= 1 ? "up" : gain <= -1 ? "down" : "flat"

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold tracking-[0.22em] text-primary uppercase">
          Progresión
        </p>
        <p className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground/75 uppercase">
          1RM est. · kg
        </p>
      </div>

      {/* Gráfico de barras: e1RM por semana del macrociclo */}
      <div className="flex items-end gap-1.5">
        {nodes.map((n) => (
          <div
            key={n.week}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "font-mono text-[10px] leading-none tabular-nums",
                n.today
                  ? "font-semibold text-primary"
                  : n.value != null
                    ? "text-foreground/70"
                    : "text-muted-foreground/25"
              )}
            >
              {n.value != null ? Math.round(n.value) : "–"}
            </span>

            <div className="flex h-20 w-full items-end">
              <div
                aria-hidden
                className={cn(
                  "w-full rounded-t-[3px]",
                  n.today &&
                    n.value != null &&
                    "bg-primary shadow-[0_0_10px_-1px] shadow-primary/60",
                  n.today &&
                    n.value == null &&
                    "border border-dashed border-primary/40 bg-primary/5",
                  !n.today && n.value != null && "bg-foreground/25",
                  !n.today && n.value == null && "bg-white/[0.04]"
                )}
                style={{
                  height:
                    n.value != null
                      ? `${heightPct(n.value)}%`
                      : n.today
                        ? "34%"
                        : "14%",
                }}
              />
            </div>

            <span
              className={cn(
                "font-mono text-[9px] leading-none tracking-[0.08em] uppercase",
                n.today ? "text-primary" : "text-muted-foreground/55"
              )}
            >
              {n.today ? "Hoy" : `S${n.week}`}
            </span>
          </div>
        ))}
      </div>

      {trend === "up" && (
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-primary">
            <ArrowUp className="size-3" strokeWidth={2.5} />+{gain} kg
          </span>
          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground/75 uppercase">
            est. desde la semana 1
          </span>
        </div>
      )}

      {trend === "flat" && (
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
            <Minus className="size-3" strokeWidth={2.5} />
            Estable
          </span>
          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground/75 uppercase">
            mantener el nivel ya es progreso
          </span>
        </div>
      )}

      {trend === "down" && (
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
            <ArrowDown className="size-3" strokeWidth={2.5} />
            {gain} kg
          </span>
          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground/75 uppercase">
            semana floja o descarga, normal
          </span>
        </div>
      )}
    </section>
  )
}

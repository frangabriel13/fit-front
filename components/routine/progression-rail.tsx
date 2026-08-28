import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { topE1RM, type SetEntry } from "@/lib/training-math"
import { cn } from "@/lib/utils"
import type { ExerciseHistory } from "@/types/api"

/** Progresión del macrociclo: un nodo por semana, medido en 1RM estimado. */

type Trend = "up" | "flat" | "down"

/**
 * La nota al pie del gráfico. Las tres caras comparten forma, así que viven en
 * una tabla en vez de en tres bloques JSX casi iguales. Sin connotación de
 * alarma: una meseta o una descarga no son un error.
 */
const TREND_NOTE: Record<Trend, { icon: LucideIcon; note: string }> = {
  up: { icon: ArrowUp, note: "est. desde la semana 1" },
  flat: { icon: Minus, note: "mantener el nivel ya es progreso" },
  down: { icon: ArrowDown, note: "semana floja o descarga, normal" },
}

function TrendNote({ trend, gain }: { trend: Trend; gain: number }) {
  const { icon: Icon, note } = TREND_NOTE[trend]
  const label =
    trend === "up" ? `+${gain} kg` : trend === "flat" ? "Estable" : `${gain} kg`

  return (
    <div className="mt-4 flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums",
          trend === "up"
            ? "bg-primary text-primary-foreground"
            : "bg-surface-raised text-muted-foreground"
        )}
      >
        <Icon className="size-3" strokeWidth={2.5} />
        {label}
      </span>
      <Eyebrow tone="meta" className="text-faint">
        {note}
      </Eyebrow>
    </div>
  )
}

export function ProgressionRail({
  history,
  week,
  totalWeeks,
  today,
}: {
  history: ExerciseHistory | undefined
  /** Semana en curso del macrociclo, 1-based. */
  week: number
  totalWeeks: number
  /** Series de hoy, si el ejercicio se está entrenando ahora. */
  today?: SetEntry[]
}) {
  const weeks = history?.weeks ?? []
  const todayDone = (today ?? []).filter((s) => s.status === "done")
  const todayTop = todayDone.length ? topE1RM(todayDone) : null

  if (weeks.length === 0 && todayTop == null) return null

  // Un nodo por semana del macrociclo. El valor es el 1RM estimado (e1RM):
  // combina peso y reps, así "mismo peso, más reps" también sube la barra.
  const nodes = Array.from({ length: totalWeeks }, (_, i) => {
    const n = i + 1
    const past = weeks[i]
    const isToday = n === week
    return { week: n, value: past ? topE1RM(past) : isToday ? todayTop : null, today: isToday }
  })

  const values = nodes.map((n) => n.value).filter((v): v is number => v != null)
  const max = values.length ? Math.max(...values) : 0
  // Línea base a la mitad del máximo: una progresión real trepa, pero las
  // mesetas quedan parejas en vez de exagerar el ruido semana a semana.
  const heightPct = (v: number) => {
    if (max <= 0) return 70
    const baseline = max * 0.5
    return Math.max(12, Math.min(100, ((v - baseline) / (max - baseline)) * 100))
  }

  const base = values[0] ?? null
  const ref = todayTop ?? topE1RM(weeks.at(-1) ?? [])
  const gain = ref != null && base != null ? Math.round(ref - base) : null
  const trend: Trend | null =
    gain == null ? null : gain >= 1 ? "up" : gain <= -1 ? "down" : "flat"

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <Eyebrow as="p" className="font-semibold text-primary">
          Progresión
        </Eyebrow>
        <Eyebrow as="p" tone="meta" className="text-faint">
          1RM est. · kg
        </Eyebrow>
      </div>

      <div className="flex items-end gap-1.5">
        {nodes.map((n) => (
          <div key={n.week} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-[10px] leading-none tabular-nums",
                n.today
                  ? "font-semibold text-primary"
                  : n.value != null
                    ? "text-muted-foreground"
                    : "text-faint"
              )}
            >
              {n.value != null ? Math.round(n.value) : "–"}
            </span>

            <div className="flex h-20 w-full items-end">
              <div
                aria-hidden
                className={cn(
                  "w-full rounded-t-[3px]",
                  n.today && n.value != null && "bg-primary",
                  n.today &&
                    n.value == null &&
                    "border border-dashed border-primary bg-surface-raised",
                  !n.today && n.value != null && "bg-done",
                  !n.today && n.value == null && "bg-hairline"
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

            <Eyebrow
              size="sm"
              tone="meta"
              className={cn(
                "leading-none",
                n.today ? "text-primary" : "text-faint"
              )}
            >
              {n.today ? "Hoy" : `S${n.week}`}
            </Eyebrow>
          </div>
        ))}
      </div>

      {trend && gain != null && <TrendNote trend={trend} gain={gain} />}
    </section>
  )
}

import { topE1RM, type SetEntry } from "@/lib/training-math"
import type { ExerciseHistory } from "@/types/api"

/**
 * La progresión de un ejercicio a lo largo del macrociclo, lista para dibujar.
 *
 * Vive acá y no en el componente por la misma razón que `lib/training-math.ts`:
 * es la medición, no el dibujo. El gráfico de `/progreso` es la pantalla que
 * justifica todo lo demás y su cálculo estaba sin poder probarse.
 */

export type Trend = "up" | "flat" | "down"

export interface ProgressionNode {
  /** Número de semana, 1-based. */
  week: number
  /** 1RM estimado de la mejor serie, o null si esa semana no tiene registro. */
  value: number | null
  /** Alto de la barra en %, o null si no hay valor (el alto lo pone el diseño). */
  heightPct: number | null
  /** La semana en curso. */
  today: boolean
}

export interface Progression {
  nodes: ProgressionNode[]
  /** Diferencia en kg entre la primera semana con datos y la referencia actual. */
  gain: number | null
  trend: Trend | null
}

/**
 * Alto de la barra, con la línea base a la MITAD del máximo.
 *
 * Escalar desde cero aplasta todas las diferencias contra la altura del pico;
 * escalar desde el mínimo convierte el ruido de una semana en una montaña.
 * Partir del 50% del máximo deja que una progresión real trepe sin exagerar
 * una meseta. El piso del 12% es para que una semana floja se siga viendo.
 */
export function barHeightPct(value: number, max: number): number {
  if (max <= 0) return 70
  const baseline = max / 2
  return Math.max(12, Math.min(100, ((value - baseline) / (max - baseline)) * 100))
}

export function progression(
  history: ExerciseHistory | undefined,
  week: number,
  totalWeeks: number,
  /** Series de hoy, si el ejercicio se está entrenando en este momento. */
  today?: SetEntry[]
): Progression | null {
  const weeks = history?.weeks ?? []
  const done = (today ?? []).filter((s) => s.status === "done")
  const todayTop = done.length > 0 ? topE1RM(done) : null

  if (weeks.length === 0 && todayTop == null) return null

  // Nunca menos columnas que semanas registradas: si el progreso informa más
  // semanas de las que tiene el macrociclo, recortar escondería entrenamientos
  // que sí pasaron.
  const columns = Math.max(totalWeeks, weeks.length)
  const values = Array.from({ length: columns }, (_, i) => {
    const past = weeks[i]
    const recorded = past ? topE1RM(past) : null
    // La semana en curso todavía no está en el historial: su valor es lo que
    // se está levantando ahora mismo.
    return recorded ?? (i + 1 === week ? todayTop : null)
  })

  const known = values.filter((v): v is number => v != null)
  const max = known.length > 0 ? Math.max(...known) : 0

  const nodes = values.map((value, i) => ({
    week: i + 1,
    value,
    heightPct: value == null ? null : barHeightPct(value, max),
    today: i + 1 === week,
  }))

  const first = known[0] ?? null
  const last = todayTop ?? topE1RM(weeks.at(-1) ?? [])
  const gain = first != null && last != null ? Math.round(last - first) : null
  // Menos de un kilo de diferencia es ruido de medición, no una tendencia.
  const trend: Trend | null =
    gain == null ? null : gain >= 1 ? "up" : gain <= -1 ? "down" : "flat"

  return { nodes, gain, trend }
}

import type { Day, DayExercise, Microcycle, Split } from "@/types/api"

/**
 * El plan de entrenamiento en el vocabulario de la PLANILLA — que es como se
 * lee una rutina en papel: "3 × 10-12 · RIR 1-2 · desc 2'30''".
 *
 * La API guarda números (`targetRepsMin/Max`, `targetRestSeconds`…) porque son
 * datos; las pantallas muestran rangos abreviados porque es lo que se lee de
 * reojo entre serie y serie. Esta capa traduce una cosa en la otra, y es pura:
 * no sabe de React ni de fetch, así que se puede probar sola.
 */

export interface PlanExercise {
  id: string
  name: string
  sets: number
  /** Reps objetivo ya abreviadas: "10-12", "10". */
  reps: string
  /** Esfuerzo objetivo: "1-2", "0-F", "F". */
  effort: string
  /** Descanso legible: "2'30''", "75''". */
  rest: string
  /** El mismo descanso en segundos, para el temporizador. */
  restSeconds: number
  /** Id de superserie: ejercicios consecutivos con el mismo id van enlazados. */
  superset?: string
  notes?: string | null
}

export interface PlanDay {
  id: string
  order: number
  name: string
  focus: string
  exercises: PlanExercise[]
}

/** Reps objetivo. Un rango cerrado en sí mismo ("10 a 10") se muestra como "10". */
export function repsLabel(ex: DayExercise): string {
  const { targetRepsMin: min, targetRepsMax: max } = ex
  if (min == null && max == null) return "—"
  if (min == null) return String(max)
  if (max == null || max === min) return String(min)
  return `${min}-${max}`
}

/**
 * Esfuerzo objetivo. El fallo cierra el rango por arriba —"0-F" es "de 0 reps
 * en reserva hasta el fallo"— y va solo cuando no hay rango que cerrar.
 */
export function effortLabel(ex: DayExercise): string {
  const { targetRirMin: min, targetRirMax: max, toFailure } = ex
  if (toFailure) return min == null ? "F" : `${min}-F`
  if (min == null && max == null)
    return ex.targetRir == null ? "—" : String(ex.targetRir)
  if (min == null) return String(max)
  if (max == null || max === min) return String(min)
  return `${min}-${max}`
}

/**
 * Descanso legible. Por debajo de dos minutos se cuenta en segundos —así se
 * pauta y así se dice— y de ahí para arriba en minutos.
 */
export function restLabel(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—"
  if (seconds < 120) return `${seconds}''`
  const min = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${min}'` : `${min}'${rest}''`
}

export function toPlanExercise(ex: DayExercise): PlanExercise {
  return {
    id: ex.id,
    name: ex.name,
    sets: ex.targetSets,
    reps: repsLabel(ex),
    effort: effortLabel(ex),
    rest: restLabel(ex.targetRestSeconds),
    restSeconds: ex.targetRestSeconds ?? 0,
    superset: ex.supersetGroup ?? undefined,
    notes: ex.notes,
  }
}

export function toPlanDay(day: Day): PlanDay {
  return {
    id: day.id,
    order: day.order,
    name: day.name,
    focus: day.focus ?? "",
    exercises: [...day.exercises]
      .sort((a, b) => a.order - b.order)
      .map(toPlanExercise),
  }
}

export function toPlanDays(microcycle: Microcycle | undefined): PlanDay[] {
  if (!microcycle) return []
  return [...microcycle.days].sort((a, b) => a.order - b.order).map(toPlanDay)
}

/**
 * El microciclo de una semana del macrociclo (1-based), que es como lo cuenta
 * `GET /splits/:id/progress`. Si esa semana no existe cae al último: un
 * macrociclo terminado sigue teniendo que mostrar algo.
 */
export function microcycleForWeek(
  split: Split | undefined,
  week: number
): Microcycle | undefined {
  if (!split || split.microcycles.length === 0) return undefined
  const ordered = [...split.microcycles].sort((a, b) => a.order - b.order)
  return ordered.find((m) => m.order === week) ?? ordered[ordered.length - 1]
}

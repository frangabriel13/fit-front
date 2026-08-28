/**
 * Matemática de entrenamiento: fórmulas y estados que NO dependen de dónde
 * vengan los datos.
 *
 * Están separadas de la capa de API a propósito: `lib/plan.ts` y
 * `lib/set-logs.ts` traducen lo que devuelve el backend, y acá vive lo que
 * significa. Eso mantiene las fórmulas probables sin levantar nada.
 */

export type SetStatus = "done" | "skipped" | "pending"

export interface SetEntry {
  weight?: number
  reps?: number
  rir?: number
  status: SetStatus
}

export interface HistSet {
  weight: number
  reps: number
  /** RIR / esfuerzo real registrado. Puede faltar: una serie puede ir sin RIR. */
  rir: number | null
}

export type ExerciseState = "pending" | "in-progress" | "done"

export function exerciseState(sets?: SetEntry[]): ExerciseState {
  if (!sets || sets.every((s) => s.status === "pending")) return "pending"
  if (sets.every((s) => s.status !== "pending")) return "done"
  return "in-progress"
}

/**
 * 1RM estimado (fórmula de Epley): convierte "peso × reps" en una sola carga
 * comparable. Así una mejora en repeticiones al mismo peso también cuenta como
 * progreso. Es una estimación (pierde precisión con reps muy altas).
 */
export function e1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

/** Mejor 1RM estimado entre las series (la serie "tope" real, no la más pesada). */
export function topE1RM(
  sets: { weight?: number; reps?: number }[]
): number | null {
  const vals = sets
    .map((s) =>
      s.weight != null && s.reps != null ? e1rm(s.weight, s.reps) : null
    )
    .filter((v): v is number => v != null)
  return vals.length ? Math.max(...vals) : null
}

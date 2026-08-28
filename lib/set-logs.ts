import type { SetEntry } from "@/lib/training-math"
import type { SetLog, WorkoutSession } from "@/types/api"

/**
 * Traducción entre las series de la API y las de la planilla.
 *
 * La API guarda dos banderas independientes (`completed`, `skipped`); las
 * pantallas piensan en UN estado por serie. La conversión vive acá y no en cada
 * componente para que "hecha", "omitida" y "pendiente" signifiquen lo mismo en
 * toda la app.
 */

export function toSetEntry(log: SetLog): SetEntry {
  if (log.skipped) return { status: "skipped" }
  if (!log.completed) return { status: "pending" }
  return {
    status: "done",
    weight: log.weight ?? undefined,
    reps: log.actualReps ?? undefined,
    rir: log.actualRir ?? undefined,
  }
}

/**
 * Las series de un ejercicio, densas y en orden: `sets` posiciones, con las que
 * no se registraron en pendiente. La grilla siempre dibuja el plan completo,
 * aunque todavía no exista ninguna fila en la base.
 */
export function entriesFor(
  logs: SetLog[] | undefined,
  exerciseId: string,
  sets: number
): SetEntry[] {
  const byNumber = new Map<number, SetLog>()
  for (const log of logs ?? []) {
    if (log.dayExerciseId === exerciseId) byNumber.set(log.setNumber, log)
  }
  // Puede haber más series registradas que planificadas (una serie extra).
  const total = Math.max(sets, ...byNumber.keys(), 0)
  return Array.from({ length: total }, (_, i) => {
    const log = byNumber.get(i + 1)
    return log ? toSetEntry(log) : { status: "pending" as const }
  })
}

/**
 * Prefijo de los ids que inventa el update optimista mientras el PUT viaja.
 * No existen en el servidor: mandarlos a un DELETE es un 404 seguro.
 */
export const OPTIMISTIC_ID_PREFIX = "optimistic-"

export const isOptimisticId = (id: string) => id.startsWith(OPTIMISTIC_ID_PREFIX)

/**
 * Busca el id de una serie ya guardada — lo necesita el DELETE al resetear.
 * Devuelve null si la serie todavía es optimista: no hay nada que borrar
 * todavía, y el refetch que sigue al guardado trae el id real.
 */
export function findSetLogId(
  session: WorkoutSession | undefined,
  exerciseId: string,
  setNumber: number
): string | null {
  const log = session?.setLogs.find(
    (l) => l.dayExerciseId === exerciseId && l.setNumber === setNumber
  )
  if (!log || isOptimisticId(log.id)) return null
  return log.id
}

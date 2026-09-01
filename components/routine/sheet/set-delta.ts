import type { HistSet, SetEntry } from "@/lib/training-math"

export type Delta = { dir: "up" | "down" | "flat"; value: string; unit: string }

/** Progreso de una serie: prioriza el salto de peso; si empató, mira reps. */
export function setDelta(today: SetEntry, prev?: HistSet): Delta | null {
  if (!prev || today.weight == null) return null
  const dw = Math.round((today.weight - prev.weight) * 10) / 10
  if (dw !== 0)
    return { dir: dw > 0 ? "up" : "down", value: `${dw > 0 ? "+" : ""}${dw}`, unit: "kg" }
  // Sin reps anotadas no hay con qué comparar. Tratar el faltante como 0 —lo
  // que hacía el `?? 0`— dibujaba "-10 reps" sobre una serie que solo no tiene
  // el dato: es una regresión inventada.
  if (today.reps == null) return null
  const dr = today.reps - prev.reps
  if (dr !== 0)
    return {
      dir: dr > 0 ? "up" : "down",
      value: `${dr > 0 ? "+" : ""}${dr}`,
      unit: Math.abs(dr) === 1 ? "rep" : "reps",
    }
  return { dir: "flat", value: "igual", unit: "" }
}

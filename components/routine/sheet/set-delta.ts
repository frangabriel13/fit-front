import type { HistSet, SetEntry } from "@/lib/training-math"

export type Delta = { dir: "up" | "down" | "flat"; value: string; unit: string }

/** Progreso de una serie: prioriza el salto de peso; si empató, mira reps. */
export function setDelta(today: SetEntry, prev?: HistSet): Delta | null {
  if (!prev || today.weight == null) return null
  const dw = Math.round((today.weight - prev.weight) * 10) / 10
  if (dw !== 0)
    return { dir: dw > 0 ? "up" : "down", value: `${dw > 0 ? "+" : ""}${dw}`, unit: "kg" }
  const dr = (today.reps ?? 0) - prev.reps
  if (dr !== 0)
    return {
      dir: dr > 0 ? "up" : "down",
      value: `${dr > 0 ? "+" : ""}${dr}`,
      unit: Math.abs(dr) === 1 ? "rep" : "reps",
    }
  return { dir: "flat", value: "igual", unit: "" }
}

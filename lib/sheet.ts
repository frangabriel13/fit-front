import type { RoutineExercise } from "@/lib/routine-data"

/**
 * El lenguaje "planilla": cómo se numera y se abrevia una rutina en papel.
 * Puro y sin JSX — lo consumen tanto el overview (/rutina) como el modo
 * entrenamiento (/rutina/entrenar).
 */

/** Abreviaturas de planilla: "10 a 12" → "10-12", "0 o fallo" → "0-F". */
export function sheet(value: string): string {
  return value.replace(" o fallo", "-F").replaceAll(" a ", "-")
}

export interface SheetItem {
  ex: RoutineExercise
  num: string
  letter?: string
  /** Primera(s) mitad(es) de una superserie: encadena sin pausa con la siguiente. */
  chains: boolean
}

/**
 * Numera los ejercicios de un día como en una planilla: uno por bloque, y las
 * superseries comparten número con sufijo A/B (04A Abducciones + 04B Adducciones).
 */
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

import type { PlanExercise } from "@/lib/plan"

/**
 * El lenguaje "planilla": cómo se numera y se agrupa una rutina en papel.
 * Puro y sin JSX — lo consumen tanto el overview (/rutina) como el modo
 * entrenamiento (/rutina/entrenar).
 *
 * Las abreviaturas de reps/RIR/descanso ya vienen resueltas en `lib/plan.ts`,
 * que es donde los números de la API se vuelven texto.
 */

export interface SheetItem {
  ex: PlanExercise
  num: string
  letter?: string
  /** Primera(s) mitad(es) de una superserie: encadena sin pausa con la siguiente. */
  chains: boolean
}

/**
 * Numera los ejercicios de un día como en una planilla: uno por bloque, y las
 * superseries comparten número con sufijo A/B (04A Abducciones + 04B Adducciones).
 */
export function toSheetItems(exercises: PlanExercise[]): SheetItem[] {
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

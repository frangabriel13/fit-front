import type { SheetItem } from "@/components/routine/sheet-bits"
import { SESSION } from "@/lib/routine-data"
import { exerciseState, type ExerciseState } from "@/lib/training-math"

/**
 * Un "slot" es una posición de la planilla: un ejercicio suelto, o los dos o
 * tres miembros de una superserie que comparten número (04A + 04B). El modo
 * entrenamiento se mueve de slot en slot, no de ejercicio en ejercicio.
 */
export interface Slot {
  num: string
  items: SheetItem[]
}

export function toSlots(items: SheetItem[]): Slot[] {
  const slots: Slot[] = []
  for (const it of items) {
    const last = slots[slots.length - 1]
    if (last && last.num === it.num) last.items.push(it)
    else slots.push({ num: it.num, items: [it] })
  }
  return slots
}

export function slotState(slot: Slot): ExerciseState {
  const states = slot.items.map((it) => exerciseState(SESSION.logs[it.ex.name]))
  if (states.every((s) => s === "done")) return "done"
  if (states.some((s) => s !== "pending")) return "in-progress"
  return "pending"
}

export function slotTitle(slot: Slot): string {
  return slot.items.length > 1
    ? slot.items.map((it) => it.ex.name).join(" + ")
    : slot.items[0].ex.name
}

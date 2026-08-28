import type { SheetItem } from "@/lib/sheet"
import { exerciseState, type ExerciseState, type SetEntry } from "@/lib/training-math"

/**
 * Un "slot" es una posición de la planilla: un ejercicio suelto, o los dos o
 * tres miembros de una superserie que comparten número (04A + 04B). El modo
 * entrenamiento se mueve de slot en slot, no de ejercicio en ejercicio.
 */
export interface Slot {
  num: string
  items: SheetItem[]
}

/** De dónde salen las series registradas de un ejercicio. */
export type EntriesLookup = (exerciseId: string) => SetEntry[] | undefined

export function toSlots(items: SheetItem[]): Slot[] {
  const slots: Slot[] = []
  for (const it of items) {
    const last = slots[slots.length - 1]
    if (last && last.num === it.num) last.items.push(it)
    else slots.push({ num: it.num, items: [it] })
  }
  return slots
}

/**
 * El estado del slot es el de sus miembros juntos: una biserie no está hecha
 * hasta que lo están A y B. El registro entra por parámetro porque de dónde
 * salen las series es asunto de quien llama, no de la planilla.
 */
export function slotState(slot: Slot, entriesOf: EntriesLookup): ExerciseState {
  const states = slot.items.map((it) => exerciseState(entriesOf(it.ex.id)))
  if (states.every((s) => s === "done")) return "done"
  if (states.some((s) => s !== "pending")) return "in-progress"
  return "pending"
}

export function slotTitle(slot: Slot): string {
  return slot.items.length > 1
    ? slot.items.map((it) => it.ex.name).join(" + ")
    : slot.items[0].ex.name
}

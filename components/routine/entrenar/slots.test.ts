import { describe, expect, it } from "vitest"

import type { PlanExercise } from "@/lib/plan"
import { toSheetItems } from "@/lib/sheet"
import type { SetEntry } from "@/lib/training-math"
import { slotState, slotTitle, toSlots, type EntriesLookup } from "./slots"

const ex = (name: string, superset?: string): PlanExercise => ({
  id: name.toLowerCase(),
  name,
  sets: 3,
  reps: "10-12",
  effort: "1-2",
  rest: "90''",
  restSeconds: 90,
  superset,
})

/**
 * Los slots se arman sobre lo que produce la planilla, no sobre items a mano:
 * `toSlots` agrupa por número, y quien reparte los números es `toSheetItems`.
 * Armar la entrada acá permitiría probar formas que la app nunca genera.
 */
const slotsOf = (...exercises: PlanExercise[]) => toSlots(toSheetItems(exercises))

const entries = (...statuses: SetEntry["status"][]): SetEntry[] =>
  statuses.map((status) => ({ status }))

/** Registro por id de ejercicio; lo que no está listado no tiene series. */
const lookup =
  (byId: Record<string, SetEntry[]>): EntriesLookup =>
  (id) =>
    byId[id]

describe("toSlots", () => {
  it("cada ejercicio suelto ocupa su propio slot", () => {
    const slots = slotsOf(ex("Sentadilla"), ex("Prensa"))
    expect(slots.map((s) => s.num)).toEqual(["01", "02"])
    expect(slots.map((s) => s.items.length)).toEqual([1, 1])
  })

  it("los miembros de una superserie caen en un solo slot", () => {
    const slots = slotsOf(ex("Extensión", "A"), ex("Zancadas", "A"))
    expect(slots).toHaveLength(1)
    expect(slots[0].num).toBe("01")
    expect(slots[0].items.map((i) => i.ex.name)).toEqual(["Extensión", "Zancadas"])
  })

  it("un ejercicio en el medio corta la agrupación", () => {
    // Van los tres a slots distintos porque la planilla ya les dio números
    // distintos: agrupar por adyacencia y no por nombre de grupo es lo que
    // impide que dos ejercicios separados se muestren como una biserie.
    const slots = slotsOf(ex("Uno", "A"), ex("Medio"), ex("Dos", "A"))
    expect(slots.map((s) => s.num)).toEqual(["01", "02", "03"])
  })

  it("un día vacío no tiene slots", () => {
    expect(toSlots([])).toEqual([])
  })
})

describe("slotState", () => {
  it("sin series registradas, el slot está pendiente", () => {
    const [slot] = slotsOf(ex("Sentadilla"))
    expect(slotState(slot, lookup({}))).toBe("pending")
  })

  it("un slot suelto hereda el estado de su ejercicio", () => {
    const [slot] = slotsOf(ex("Sentadilla"))
    const registro = lookup({ sentadilla: entries("done", "pending", "pending") })
    expect(slotState(slot, registro)).toBe("in-progress")
  })

  it("una biserie no está hecha hasta que lo están las dos mitades", () => {
    const [slot] = slotsOf(ex("Extensión", "A"), ex("Zancadas", "A"))
    const registro = lookup({
      extensión: entries("done", "done", "done"),
      zancadas: entries("pending", "pending", "pending"),
    })
    expect(slotState(slot, registro)).toBe("in-progress")
  })

  it("la biserie recién cierra con las dos mitades cerradas", () => {
    const [slot] = slotsOf(ex("Extensión", "A"), ex("Zancadas", "A"))
    const registro = lookup({
      extensión: entries("done", "done", "done"),
      // Omitir también cierra: sobre esas series ya se decidió.
      zancadas: entries("done", "skipped", "done"),
    })
    expect(slotState(slot, registro)).toBe("done")
  })

  it("basta con que una mitad haya arrancado para que el slot esté en curso", () => {
    const [slot] = slotsOf(ex("Extensión", "A"), ex("Zancadas", "A"))
    const registro = lookup({
      extensión: entries("done", "pending", "pending"),
    })
    expect(slotState(slot, registro)).toBe("in-progress")
  })
})

describe("slotTitle", () => {
  it("un ejercicio solo se titula con su nombre", () => {
    const [slot] = slotsOf(ex("Sentadilla"))
    expect(slotTitle(slot)).toBe("Sentadilla")
  })

  it("la superserie une los nombres de sus miembros", () => {
    const [slot] = slotsOf(ex("Extensión", "A"), ex("Zancadas", "A"))
    expect(slotTitle(slot)).toBe("Extensión + Zancadas")
  })
})

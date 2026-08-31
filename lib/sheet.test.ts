import { describe, expect, it } from "vitest"

import type { PlanExercise } from "@/lib/plan"
import { toSheetItems } from "@/lib/sheet"

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

/** "01A Sentadilla→" — número, letra y si encadena, en una línea legible. */
const shape = (items: ReturnType<typeof toSheetItems>) =>
  items.map((i) => `${i.num}${i.letter ?? ""} ${i.ex.name}${i.chains ? "→" : ""}`)

describe("toSheetItems", () => {
  it("numera un ejercicio por bloque, con dos dígitos", () => {
    expect(shape(toSheetItems([ex("Sentadilla"), ex("Prensa")]))).toEqual([
      "01 Sentadilla",
      "02 Prensa",
    ])
  })

  it("una biserie comparte número y se reparte A/B", () => {
    expect(
      shape(toSheetItems([ex("Extensión", "A"), ex("Zancadas", "A")]))
    ).toEqual(["01A Extensión→", "01B Zancadas"])
  })

  it("solo el último miembro de la superserie no encadena", () => {
    const items = toSheetItems([
      ex("Uno", "A"),
      ex("Dos", "A"),
      ex("Tres", "A"),
    ])
    expect(items.map((i) => i.chains)).toEqual([true, true, false])
    expect(items.map((i) => i.letter)).toEqual(["A", "B", "C"])
  })

  it("la numeración sigue después de una superserie", () => {
    expect(
      shape(
        toSheetItems([
          ex("Sentadilla"),
          ex("Extensión", "A"),
          ex("Zancadas", "A"),
          ex("Hip Thrust"),
        ])
      )
    ).toEqual([
      "01 Sentadilla",
      "02A Extensión→",
      "02B Zancadas",
      "03 Hip Thrust",
    ])
  })

  it("solo agrupa CONSECUTIVOS: mismo grupo separado son bloques distintos", () => {
    // Si agrupara por nombre de grupo y no por adyacencia, la planilla diría
    // que dos ejercicios con otro en el medio se hacen sin pausa entre ellos.
    expect(
      shape(toSheetItems([ex("Uno", "A"), ex("Medio"), ex("Dos", "A")]))
    ).toEqual(["01 Uno", "02 Medio", "03 Dos"])
  })

  it("un ejercicio solo con grupo no lleva letra", () => {
    const [item] = toSheetItems([ex("Solo", "A")])
    expect(item.letter).toBeUndefined()
    expect(item.chains).toBe(false)
  })

  it("un día vacío no rompe", () => {
    expect(toSheetItems([])).toEqual([])
  })
})

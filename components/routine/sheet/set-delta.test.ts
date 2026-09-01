import { describe, expect, it } from "vitest"

import type { HistSet, SetEntry } from "@/lib/training-math"
import { setDelta } from "./set-delta"

const hoy = (weight?: number, reps?: number): SetEntry => ({
  status: "done",
  weight,
  reps,
})

const antes = (weight: number, reps: number): HistSet => ({
  weight,
  reps,
  rir: null,
})

describe("setDelta", () => {
  it("sin la semana anterior no hay con qué comparar", () => {
    expect(setDelta(hoy(60, 10))).toBeNull()
  })

  it("sin peso de hoy no hay comparación", () => {
    expect(setDelta(hoy(undefined, 10), antes(60, 10))).toBeNull()
  })

  it("subir el peso es progreso, con signo", () => {
    expect(setDelta(hoy(62.5, 10), antes(60, 10))).toEqual({
      dir: "up",
      value: "+2.5",
      unit: "kg",
    })
  })

  it("bajar el peso va sin signo: el menos ya lo trae el número", () => {
    expect(setDelta(hoy(55, 10), antes(60, 10))).toEqual({
      dir: "down",
      value: "-5",
      unit: "kg",
    })
  })

  it("el peso manda: si cambió, las reps no se miran", () => {
    // Más peso con menos reps sigue siendo "+2.5 kg", no una regresión.
    expect(setDelta(hoy(62.5, 8), antes(60, 12))).toEqual({
      dir: "up",
      value: "+2.5",
      unit: "kg",
    })
  })

  it("con el mismo peso, la comparación pasa a las reps", () => {
    expect(setDelta(hoy(60, 12), antes(60, 10))).toEqual({
      dir: "up",
      value: "+2",
      unit: "reps",
    })
  })

  it("una sola repetición va en singular, para los dos lados", () => {
    expect(setDelta(hoy(60, 11), antes(60, 10))?.unit).toBe("rep")
    expect(setDelta(hoy(60, 9), antes(60, 10))).toEqual({
      dir: "down",
      value: "-1",
      unit: "rep",
    })
  })

  it("mismo peso y mismas reps es 'igual', no ausencia de dato", () => {
    expect(setDelta(hoy(60, 10), antes(60, 10))).toEqual({
      dir: "flat",
      value: "igual",
      unit: "",
    })
  })

  it("el ruido de los decimales no llega al chip", () => {
    // 60.1 - 60 da 0.09999999999999432 en coma flotante; el chip dice "+0.1".
    expect(setDelta(hoy(60.1, 10), antes(60, 10))?.value).toBe("+0.1")
  })

  it("una diferencia menor a 100 g no cuenta como cambio de peso", () => {
    // Redondea a 0 kg, así que el chip pasa a hablar de reps.
    expect(setDelta(hoy(60.04, 12), antes(60, 10))).toEqual({
      dir: "up",
      value: "+2",
      unit: "reps",
    })
  })

  it("sin reps anotadas no inventa una regresión", () => {
    // Una serie puede guardarse con peso y sin reps. Contarlas como 0 dibujaba
    // "-10 reps" sobre algo que solo no tiene el dato.
    expect(setDelta(hoy(60), antes(60, 10))).toBeNull()
  })
})

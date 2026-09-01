import { describe, expect, it } from "vitest"

import { barHeightPct, progression } from "@/lib/progression"
import type { SetEntry } from "@/lib/training-math"
import type { ExerciseHistory, HistorySet } from "@/types/api"

const set = (weight: number, reps: number): HistorySet => ({ weight, reps, rir: null })

/** Una semana por argumento. `e1rm(60,10)` = 80, `e1rm(65,10)` ≈ 86,7. */
const history = (...weeks: HistorySet[][]): ExerciseHistory => ({
  name: "Sentadilla",
  weeks,
})

const done = (weight: number, reps: number): SetEntry => ({
  status: "done",
  weight,
  reps,
})

const values = (p: ReturnType<typeof progression>) =>
  p!.nodes.map((n) => (n.value == null ? null : Math.round(n.value)))

describe("progression", () => {
  it("sin historial y sin series de hoy no hay nada que dibujar", () => {
    expect(progression(undefined, 1, 4)).toBeNull()
    expect(progression(history(), 1, 4, [])).toBeNull()
  })

  it("hay una columna por semana del macrociclo", () => {
    const p = progression(history([set(60, 10)]), 1, 4)
    expect(p!.nodes.map((n) => n.week)).toEqual([1, 2, 3, 4])
    expect(values(p)).toEqual([80, null, null, null])
  })

  it("nunca recorta semanas registradas, aunque el macrociclo diga menos", () => {
    // Recortar escondería entrenamientos que sí pasaron.
    const p = progression(history([set(60, 10)], [set(65, 10)]), 2, 1)
    expect(values(p)).toEqual([80, 87])
  })

  it("la semana en curso vale lo que se está levantando ahora", () => {
    // Todavía no está en el historial: el registro llega al cerrar la semana.
    const p = progression(history([set(60, 10)]), 2, 2, [done(70, 10)])
    expect(values(p)).toEqual([80, 93])
    expect(p!.nodes[1].today).toBe(true)
  })

  it("lo ya registrado le gana a las series de hoy", () => {
    const p = progression(history([set(60, 10)], [set(65, 10)]), 2, 2, [done(70, 10)])
    expect(values(p)).toEqual([80, 87])
  })

  it("de hoy solo cuentan las series hechas", () => {
    const pendientes: SetEntry[] = [{ status: "pending" }, { status: "skipped" }]
    expect(progression(history(), 1, 2, pendientes)).toBeNull()
  })

  it("la ganancia va de la primera semana con datos a la referencia actual", () => {
    const p = progression(history([set(60, 10)], [set(65, 10)]), 2, 2)
    expect(p!.gain).toBe(7)
    expect(p!.trend).toBe("up")
  })

  it("bajar es 'down'", () => {
    const p = progression(history([set(65, 10)], [set(60, 10)]), 2, 2)
    expect(p!.gain).toBe(-7)
    expect(p!.trend).toBe("down")
  })

  it("menos de un kilo es ruido, no tendencia", () => {
    const p = progression(history([set(60, 10)], [set(60.2, 10)]), 2, 2)
    expect(p!.gain).toBe(0)
    expect(p!.trend).toBe("flat")
  })

  it("una sola semana está estable, no en progreso", () => {
    const p = progression(history([set(60, 10)]), 1, 4)
    expect(p!.trend).toBe("flat")
  })

  it("las semanas sin registro no tienen alto: el placeholder lo pone el diseño", () => {
    const p = progression(history([set(60, 10)]), 1, 3)
    expect(p!.nodes.map((n) => n.heightPct == null)).toEqual([false, true, true])
  })
})

describe("barHeightPct", () => {
  it("el máximo llega arriba de todo", () => {
    expect(barHeightPct(100, 100)).toBe(100)
  })

  it("la línea base está a la mitad del máximo", () => {
    // A mitad de camino entre la base y el pico, la barra va a la mitad.
    expect(barHeightPct(75, 100)).toBe(50)
  })

  it("por debajo de la mitad del máximo queda el piso visible", () => {
    // Ni la peor semana desaparece: una barra de 0 se leería como "sin datos".
    expect(barHeightPct(50, 100)).toBe(12)
    expect(barHeightPct(10, 100)).toBe(12)
  })

  it("sin máximo usable no divide por cero", () => {
    expect(barHeightPct(80, 0)).toBe(70)
  })

  it("todas las semanas iguales quedan parejas arriba", () => {
    // Una meseta es una meseta: no hay ruido que amplificar.
    expect(barHeightPct(80, 80)).toBe(100)
  })
})

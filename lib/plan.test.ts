import { describe, expect, it } from "vitest"

import {
  effortLabel,
  microcycleForWeek,
  repsLabel,
  restLabel,
  toPlanDay,
  toPlanExercise,
} from "@/lib/plan"
import type { Day, DayExercise, Split } from "@/types/api"

/** Un ejercicio con lo mínimo obligatorio; cada test pisa lo que le importa. */
const ex = (patch: Partial<DayExercise> = {}): DayExercise => ({
  id: "e1",
  name: "Sentadilla con barra",
  order: 1,
  targetSets: 4,
  ...patch,
})

describe("repsLabel", () => {
  it("muestra el rango cuando min y max difieren", () => {
    expect(repsLabel(ex({ targetRepsMin: 8, targetRepsMax: 10 }))).toBe("8-10")
  })

  it("colapsa a un número cuando el rango es cerrado en sí mismo", () => {
    // El backend guarda "10 reps" como min=10,max=10; "10-10" se leería raro.
    expect(repsLabel(ex({ targetRepsMin: 10, targetRepsMax: 10 }))).toBe("10")
  })

  it("tolera que falte un extremo", () => {
    expect(repsLabel(ex({ targetRepsMin: 12 }))).toBe("12")
    expect(repsLabel(ex({ targetRepsMax: 15 }))).toBe("15")
  })

  it("no inventa un objetivo cuando no hay ninguno", () => {
    expect(repsLabel(ex())).toBe("—")
  })
})

describe("effortLabel", () => {
  it("muestra el rango de RIR", () => {
    expect(effortLabel(ex({ targetRirMin: 1, targetRirMax: 2 }))).toBe("1-2")
  })

  it("el fallo solo, cuando no hay rango que cerrar", () => {
    expect(effortLabel(ex({ toFailure: true }))).toBe("F")
  })

  it("el fallo cierra el rango por arriba", () => {
    expect(effortLabel(ex({ targetRirMin: 0, toFailure: true }))).toBe("0-F")
  })

  it("el fallo gana sobre el rango: llegar al fallo es el objetivo", () => {
    expect(
      effortLabel(ex({ targetRirMin: 0, targetRirMax: 1, toFailure: true }))
    ).toBe("0-F")
  })

  it("cae al targetRir suelto del contrato viejo", () => {
    expect(effortLabel(ex({ targetRir: 2 }))).toBe("2")
  })

  it("un RIR de 0 no se confunde con 'sin dato'", () => {
    expect(effortLabel(ex({ targetRirMin: 0, targetRirMax: 0 }))).toBe("0")
  })
})

describe("restLabel", () => {
  it("cuenta en segundos por debajo de dos minutos", () => {
    expect(restLabel(45)).toBe("45''")
    expect(restLabel(75)).toBe("75''")
    expect(restLabel(90)).toBe("90''")
  })

  it("cuenta en minutos cuando son exactos", () => {
    expect(restLabel(120)).toBe("2'")
    expect(restLabel(180)).toBe("3'")
  })

  it("combina minutos y segundos", () => {
    expect(restLabel(150)).toBe("2'30''")
  })

  it("sin descanso pautado no muestra un cero", () => {
    expect(restLabel(null)).toBe("—")
    expect(restLabel(undefined)).toBe("—")
    expect(restLabel(0)).toBe("—")
  })
})

describe("toPlanExercise", () => {
  it("traduce un ejercicio real del backend", () => {
    expect(
      toPlanExercise(
        ex({
          targetSets: 4,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetRirMin: 1,
          targetRirMax: 2,
          targetRestSeconds: 150,
          supersetGroup: null,
        })
      )
    ).toEqual({
      id: "e1",
      name: "Sentadilla con barra",
      sets: 4,
      reps: "8-10",
      effort: "1-2",
      rest: "2'30''",
      restSeconds: 150,
      superset: undefined,
      notes: undefined,
    })
  })

  it("normaliza el supersetGroup nulo a ausente", () => {
    // `null` y `undefined` tienen que ser lo mismo: `toSheetItems` agrupa por
    // igualdad, y dos ejercicios sueltos con `null` se encadenarían entre sí.
    expect(toPlanExercise(ex({ supersetGroup: null })).superset).toBeUndefined()
  })
})

describe("toPlanDay", () => {
  const day: Day = {
    id: "d1",
    name: "Día 1",
    order: 1,
    focus: "Glúteo · Cuádriceps",
    exercises: [
      ex({ id: "b", name: "Segundo", order: 2 }),
      ex({ id: "a", name: "Primero", order: 1 }),
    ],
  }

  it("ordena los ejercicios por order, no por como vinieron", () => {
    expect(toPlanDay(day).exercises.map((e) => e.name)).toEqual([
      "Primero",
      "Segundo",
    ])
  })

  it("un día sin focus no rompe el texto de la tarjeta", () => {
    expect(toPlanDay({ ...day, focus: null }).focus).toBe("")
  })
})

describe("microcycleForWeek", () => {
  const split = (orders: number[]): Split => ({
    id: "s1",
    name: "Macro",
    microcycles: orders.map((o) => ({
      id: `m${o}`,
      name: `Semana ${o}`,
      order: o,
      days: [],
    })),
  })

  it("elige el microciclo de la semana en curso", () => {
    expect(microcycleForWeek(split([1, 2, 3]), 2)?.name).toBe("Semana 2")
  })

  it("ordena antes de elegir", () => {
    expect(microcycleForWeek(split([3, 1, 2]), 1)?.name).toBe("Semana 1")
  })

  it("un macrociclo terminado cae al último en vez de quedar en blanco", () => {
    expect(microcycleForWeek(split([1, 2, 3]), 9)?.name).toBe("Semana 3")
  })

  it("sin rutina o sin microciclos devuelve undefined", () => {
    expect(microcycleForWeek(undefined, 1)).toBeUndefined()
    expect(microcycleForWeek(split([]), 1)).toBeUndefined()
  })
})

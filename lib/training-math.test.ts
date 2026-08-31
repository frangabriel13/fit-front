import { describe, expect, it } from "vitest"

import { e1rm, exerciseState, topE1RM, type SetEntry } from "@/lib/training-math"

describe("exerciseState", () => {
  const s = (...statuses: SetEntry["status"][]): SetEntry[] =>
    statuses.map((status) => ({ status }))

  it("todo pendiente es pendiente", () => {
    expect(exerciseState(s("pending", "pending"))).toBe("pending")
  })

  it("nada pendiente es hecho, aunque haya omitidas", () => {
    // Un ejercicio con series omitidas está CERRADO: se decidió sobre todas.
    expect(exerciseState(s("done", "skipped"))).toBe("done")
  })

  it("mezcla con pendientes es en curso", () => {
    expect(exerciseState(s("done", "pending"))).toBe("in-progress")
  })

  it("sin registro es pendiente", () => {
    expect(exerciseState(undefined)).toBe("pending")
    expect(exerciseState([])).toBe("pending")
  })
})

describe("e1rm", () => {
  it("a una repetición, el 1RM estimado es el peso", () => {
    expect(e1rm(100, 1)).toBeCloseTo(103.33, 2)
  })

  it("más reps al mismo peso estiman más fuerza", () => {
    expect(e1rm(60, 10)).toBeGreaterThan(e1rm(60, 8))
  })

  it("Epley: peso × (1 + reps/30)", () => {
    expect(e1rm(60, 10)).toBeCloseTo(80, 6)
    expect(e1rm(65, 10)).toBeCloseTo(86.67, 2)
  })
})

describe("topE1RM", () => {
  it("toma la mejor serie, no la más pesada", () => {
    // 50×12 (=70) supera a 60×5 (=70)… empatan; 55×12 (=77) gana a 60×8 (=76).
    expect(topE1RM([{ weight: 60, reps: 8 }, { weight: 55, reps: 12 }])).toBeCloseTo(
      77,
      0
    )
  })

  it("ignora las series sin peso o sin reps", () => {
    expect(
      topE1RM([{ weight: 60 }, { reps: 10 }, { weight: 50, reps: 10 }])
    ).toBeCloseTo(66.67, 2)
  })

  it("sin ninguna serie usable devuelve null, no 0", () => {
    // Un 0 se dibujaría como una barra al piso; null es "no hay dato".
    expect(topE1RM([])).toBeNull()
    expect(topE1RM([{ weight: 60 }])).toBeNull()
  })
})

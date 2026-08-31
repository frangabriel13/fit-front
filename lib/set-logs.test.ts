import { describe, expect, it } from "vitest"

import {
  entriesFor,
  findSetLogId,
  isOptimisticId,
  OPTIMISTIC_ID_PREFIX,
  toSetEntry,
} from "@/lib/set-logs"
import type { SetLog, WorkoutSession } from "@/types/api"

const log = (patch: Partial<SetLog> = {}): SetLog => ({
  id: "l1",
  dayExerciseId: "e1",
  setNumber: 1,
  completed: false,
  ...patch,
})

describe("toSetEntry", () => {
  it("completada con datos es una serie hecha", () => {
    expect(
      toSetEntry(log({ completed: true, weight: 62.5, actualReps: 9, actualRir: 1 }))
    ).toEqual({ status: "done", weight: 62.5, reps: 9, rir: 1 })
  })

  it("omitida gana sobre completada: ya se decidió que no se hace", () => {
    expect(toSetEntry(log({ completed: true, skipped: true })).status).toBe(
      "skipped"
    )
  })

  it("una fila a medio llenar sigue pendiente", () => {
    expect(toSetEntry(log({ weight: 60 })).status).toBe("pending")
  })

  it("los nulos de la API no se cuelan como null en la planilla", () => {
    expect(
      toSetEntry(log({ completed: true, weight: null, actualReps: null, actualRir: null }))
    ).toEqual({ status: "done", weight: undefined, reps: undefined, rir: undefined })
  })

  it("un RIR de 0 se conserva, no se pierde por ser falsy", () => {
    expect(toSetEntry(log({ completed: true, actualRir: 0 })).rir).toBe(0)
  })
})

describe("entriesFor", () => {
  it("devuelve tantas posiciones como series planificadas", () => {
    expect(entriesFor([], "e1", 4)).toHaveLength(4)
    expect(entriesFor([], "e1", 4).every((e) => e.status === "pending")).toBe(true)
  })

  it("ubica cada serie en su posición, con huecos pendientes", () => {
    const logs = [
      log({ setNumber: 3, completed: true, weight: 60, actualReps: 8 }),
      log({ setNumber: 1, completed: true, weight: 50, actualReps: 10 }),
    ]
    expect(entriesFor(logs, "e1", 3).map((e) => e.status)).toEqual([
      "done",
      "pending",
      "done",
    ])
  })

  it("ignora las series de otro ejercicio", () => {
    const logs = [log({ dayExerciseId: "otro", completed: true, weight: 99 })]
    expect(entriesFor(logs, "e1", 2).every((e) => e.status === "pending")).toBe(
      true
    )
  })

  it("una serie extra estira la grilla más allá de lo planificado", () => {
    // Si alguien hizo 5 series donde había 3 pautadas, la planilla las muestra.
    const logs = [log({ setNumber: 5, completed: true, weight: 40 })]
    expect(entriesFor(logs, "e1", 3)).toHaveLength(5)
  })

  it("sin sesión todavía, muestra el plan completo en pendiente", () => {
    expect(entriesFor(undefined, "e1", 2).map((e) => e.status)).toEqual([
      "pending",
      "pending",
    ])
  })
})

describe("findSetLogId", () => {
  const session = (logs: SetLog[]): WorkoutSession => ({
    id: "s1",
    dayId: "d1",
    performedAt: new Date().toISOString(),
    setLogs: logs,
  })

  it("encuentra la serie por ejercicio y número", () => {
    expect(
      findSetLogId(session([log({ id: "real", setNumber: 2 })]), "e1", 2)
    ).toBe("real")
  })

  it("no devuelve ids optimistas: no existen en el servidor", () => {
    // Mandarlos a un DELETE es un 404 seguro; el refetch traerá el id real.
    const fake = `${OPTIMISTIC_ID_PREFIX}e1:1`
    expect(findSetLogId(session([log({ id: fake })]), "e1", 1)).toBeNull()
    expect(isOptimisticId(fake)).toBe(true)
  })

  it("sin sesión o sin la serie, null", () => {
    expect(findSetLogId(undefined, "e1", 1)).toBeNull()
    expect(findSetLogId(session([]), "e1", 1)).toBeNull()
  })
})

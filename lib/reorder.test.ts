import { describe, expect, it } from "vitest"

import { applyOrders, reorder } from "@/lib/reorder"
import type { DayExercise, Split } from "@/types/api"

/** Lista mínima: lo único que mira `reorder` es `id` y `order`. */
const list = (...orders: number[]) =>
  orders.map((order, i) => ({ id: String.fromCharCode(97 + i), order }))

/** "a:0 b:1" — id y número, en una línea legible. */
const shape = (items: { id: string; order: number }[]) =>
  items.map((i) => `${i.id}:${i.order}`).join(" ")

describe("reorder", () => {
  it("mover hacia abajo intercambia con el siguiente", () => {
    const { items } = reorder(list(0, 1, 2), 0, 1)
    expect(shape(items)).toBe("b:0 a:1 c:2")
  })

  it("mover hacia arriba intercambia con el anterior", () => {
    const { items } = reorder(list(0, 1, 2), 2, -1)
    expect(shape(items)).toBe("a:0 c:1 b:2")
  })

  it("en una lista prolija solo cambian los dos que se cruzaron", () => {
    const { patches } = reorder(list(0, 1, 2, 3), 1, 1)
    expect(patches).toEqual([
      { id: "c", order: 1 },
      { id: "b", order: 2 },
    ])
  })

  it("el primero no puede subir y el último no puede bajar", () => {
    const items = list(0, 1, 2)
    // Devuelve la lista original tal cual: sin PATCH y sin repintar.
    expect(reorder(items, 0, -1)).toEqual({ items, patches: [] })
    expect(reorder(items, 2, 1)).toEqual({ items, patches: [] })
  })

  it("un índice fuera de rango no hace nada", () => {
    const items = list(0, 1)
    expect(reorder(items, 5, 1).patches).toEqual([])
    expect(reorder(items, -1, 1).patches).toEqual([])
  })

  it("respeta la base: los días arrancan en 0", () => {
    expect(shape(reorder(list(0, 1, 2), 1, 1).items)).toBe("a:0 c:1 b:2")
  })

  it("respeta la base: las semanas arrancan en 1", () => {
    // El `order` de un microciclo ES el número de semana. Renumerar desde 0
    // dejaría la primera semana en 0 y `microcycleForWeek` no la encontraría.
    expect(shape(reorder(list(1, 2, 3), 1, 1).items)).toBe("a:1 c:2 b:3")
  })

  it("cierra los huecos que hubiera dejado el campo 'Orden' a mano", () => {
    const { items, patches } = reorder(list(0, 5, 9), 0, 1)
    expect(shape(items)).toBe("b:0 a:1 c:2")
    expect(patches).toHaveLength(3)
  })

  it("deshace los empates, que son los que impedían moverse", () => {
    // Con dos elementos en el mismo número, intercambiarlos no se notaría.
    const { items } = reorder(list(0, 0, 1), 0, 1)
    expect(shape(items)).toBe("b:0 a:1 c:2")
  })

  it("no muta la lista que recibe", () => {
    const items = list(0, 1, 2)
    reorder(items, 0, 1)
    expect(shape(items)).toBe("a:0 b:1 c:2")
  })
})

const ex = (id: string, order: number): DayExercise => ({
  id,
  name: id,
  order,
  targetSets: 3,
})

const split: Split = {
  id: "s",
  name: "Rutina",
  microcycles: [
    {
      id: "m1",
      name: "Semana 1",
      order: 1,
      days: [
        { id: "d1", name: "Día 1", order: 0, exercises: [ex("e1", 0), ex("e2", 1)] },
        { id: "d2", name: "Día 2", order: 1, exercises: [] },
      ],
    },
    { id: "m2", name: "Semana 2", order: 2, days: [] },
  ],
}

describe("applyOrders", () => {
  it("renumera microciclos sin tocar lo que cuelga de ellos", () => {
    const next = applyOrders(split, "microcycles", [
      { id: "m1", order: 2 },
      { id: "m2", order: 1 },
    ])
    expect(next.microcycles.map((m) => m.order)).toEqual([2, 1])
    expect(next.microcycles[0].days).toBe(split.microcycles[0].days)
  })

  it("renumera días adentro de su semana", () => {
    const next = applyOrders(split, "days", [{ id: "d2", order: 0 }])
    expect(next.microcycles[0].days.map((d) => d.order)).toEqual([0, 0])
  })

  it("llega hasta los ejercicios, tres niveles abajo", () => {
    const next = applyOrders(split, "exercises", [
      { id: "e1", order: 1 },
      { id: "e2", order: 0 },
    ])
    expect(next.microcycles[0].days[0].exercises.map((e) => e.order)).toEqual([1, 0])
  })

  it("un id que no está en los patches queda intacto", () => {
    const next = applyOrders(split, "exercises", [{ id: "e2", order: 0 }])
    expect(next.microcycles[0].days[0].exercises[0]).toEqual(ex("e1", 0))
  })

  it("sin patches devuelve el mismo objeto, no una copia", () => {
    // Copiar por copiar haría que React Query notifique un cambio que no hubo.
    expect(applyOrders(split, "days", [])).toBe(split)
  })

  it("no muta el split original", () => {
    applyOrders(split, "microcycles", [{ id: "m1", order: 9 }])
    expect(split.microcycles[0].order).toBe(1)
  })
})

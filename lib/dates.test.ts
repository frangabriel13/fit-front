import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { hhmm, isToday } from "@/lib/dates"

/**
 * Estos tests corren en horario argentino a propósito.
 *
 * `isToday` compara contra el calendario del NAVEGADOR, y la máquina donde
 * corre la suite está en UTC. Con UTC estos casos no distinguirían una
 * implementación correcta de una que corte el string ISO: la diferencia recién
 * aparece cuando la hora local y la UTC caen en días distintos, que es lo que
 * pasa todas las noches en Argentina a partir de las 21.
 *
 * `lib/dates.ts` no lee la zona al importarse —solo dentro de las funciones—,
 * así que alcanza con setearla acá arriba.
 */
const TZ_PREVIA = process.env.TZ
process.env.TZ = "America/Argentina/Buenos_Aires"

afterAll(() => {
  process.env.TZ = TZ_PREVIA
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Las 22:30 del 2 de septiembre en Argentina. En UTC ya es el 3. */
const ANOCHE = "2026-09-03T01:30:00.000Z"

describe("isToday", () => {
  it("la sesión de temprano sigue siendo de hoy pasada la medianoche UTC", () => {
    vi.setSystemTime(new Date(ANOCHE))
    // Empezó a las 20:00 del 2 en Argentina y vuelve a las 22:30 del mismo día.
    // Los dos instantes son del 2 en local, pero en UTC caen en días distintos
    // (el 2 y el 3): comparando la fecha del ISO, a las 21 la sesión de las 20
    // deja de contar como de hoy y se abre una nueva encima.
    expect(isToday("2026-09-02T23:00:00.000Z")).toBe(true)
  })

  it("una sesión cuyo ISO ya dice mañana también es de hoy", () => {
    vi.setSystemTime(new Date(ANOCHE))
    // 22:00 del 2 en Argentina, pero el string dice "2026-09-03".
    expect(isToday("2026-09-03T01:00:00.000Z")).toBe(true)
  })

  it("la medianoche local es hoy", () => {
    vi.setSystemTime(new Date(ANOCHE))
    expect(isToday("2026-09-02T03:00:00.000Z")).toBe(true)
  })

  it("lo de ayer no es hoy", () => {
    vi.setSystemTime(new Date(ANOCHE))
    // 20:00 del 1 en Argentina.
    expect(isToday("2026-09-01T23:00:00.000Z")).toBe(false)
  })

  it("mismo número de día pero otro mes no es hoy", () => {
    vi.setSystemTime(new Date(ANOCHE))
    // Comparar solo `getDate()` daría true: los dos son un día 2.
    expect(isToday("2026-08-02T23:00:00.000Z")).toBe(false)
  })

  it("mismo día y mes pero otro año no es hoy", () => {
    vi.setSystemTime(new Date(ANOCHE))
    expect(isToday("2025-09-02T23:00:00.000Z")).toBe(false)
  })

  it("el corte del día es la medianoche local, no la de UTC", () => {
    // 00:30 del 3 en Argentina: ya es otro día para quien entrena.
    vi.setSystemTime(new Date("2026-09-03T03:30:00.000Z"))
    // Esto es 23:00 del 2 en Argentina, o sea ayer — pero en UTC ambos caen
    // en el 3, así que una comparación en UTC diría que sí.
    expect(isToday("2026-09-03T02:00:00.000Z")).toBe(false)
  })
})

describe("hhmm", () => {
  it("muestra la hora local, no la UTC", () => {
    expect(hhmm("2026-09-03T01:00:00.000Z")).toBe("22:00")
  })

  it("rellena con cero a la izquierda", () => {
    expect(hhmm("2026-09-02T11:05:00.000Z")).toBe("08:05")
  })

  it("la medianoche es 00:00 y no 24:00 ni 0:0", () => {
    expect(hhmm("2026-09-02T03:00:00.000Z")).toBe("00:00")
  })
})

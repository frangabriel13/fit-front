import type { Split } from "@/types/api"

/**
 * Mover elementos de la rutina de lugar.
 *
 * La API guarda la posición en un `order` numérico por elemento y reordenar es
 * mandarle la lista completa de hermanos en el orden deseado
 * (`PUT .../order { ids }`). Lo que decide CÓMO queda esa lista vive acá, puro
 * y sin React; el envío, en `hooks/use-reorder.ts`.
 */

/** Lo mínimo que se necesita para posicionar algo: quién es y en qué lugar va. */
export interface Ordered {
  id: string
  order: number
}

/** Qué nivel de la rutina se está moviendo. Define el endpoint y dónde aplicar. */
export type OrderedKind = "microcycles" | "days" | "exercises"

export interface Reordered<T> {
  /** La lista ya movida y renumerada — para pintar sin esperar al servidor. */
  items: T[]
  /** `false` si el movimiento no era posible: no hay nada que mandar ni repintar. */
  moved: boolean
}

/**
 * Mueve un elemento un lugar y renumera.
 *
 * La numeración se reasigna SIEMPRE como `min, min+1, min+2…` sobre el mínimo
 * que ya había, en vez de conservar los números existentes. Dos razones:
 *
 *  - No todos los niveles arrancan en el mismo número. Los días y ejercicios
 *    empiezan en 0 y las semanas en 1 (el `order` de un microciclo ES el número
 *    de semana: `microcycleForWeek` lo busca por igualdad). Anclarse al mínimo
 *    respeta las dos convenciones sin tener que saber cuál es cuál.
 *  - Se lleva puestos los empates y los huecos. Nada impide en la base que dos
 *    elementos compartan `order` —el editor tenía un campo "Orden" a mano—, y
 *    con un empate un intercambio no movería nada.
 *
 * Es la misma regla que aplica el server al recibir los ids, así que lo que se
 * pinta acá y lo que queda guardado coinciden.
 */
export function reorder<T extends Ordered>(
  items: T[],
  index: number,
  dir: -1 | 1
): Reordered<T> {
  const target = index + dir
  if (index < 0 || index >= items.length || target < 0 || target >= items.length)
    return { items, moved: false }

  const moved = [...items]
  ;[moved[index], moved[target]] = [moved[target], moved[index]]

  const base = Math.min(...items.map((i) => i.order))
  return { items: moved.map((item, i) => ({ ...item, order: base + i })), moved: true }
}

/**
 * Escribe nuevos números dentro del `Split` cacheado.
 *
 * Todo el editor lee una sola query (el detalle de la rutina), así que tanto el
 * repintado optimista como la reconciliación con la respuesta del server son
 * reescribir ese objeto. Se aplica por id y en el nivel que corresponde: los ids
 * son únicos, pero buscar en todos los niveles haría que un mismo número tocara
 * cosas de distinta profundidad.
 */
export function applyOrders(
  split: Split,
  kind: OrderedKind,
  orders: Ordered[]
): Split {
  if (orders.length === 0) return split
  const byId = new Map(orders.map((o) => [o.id, o.order]))
  const at = <T extends Ordered>(item: T): T => {
    const order = byId.get(item.id)
    return order == null ? item : { ...item, order }
  }

  if (kind === "microcycles")
    return { ...split, microcycles: split.microcycles.map(at) }

  return {
    ...split,
    microcycles: split.microcycles.map((m) => ({
      ...m,
      days:
        kind === "days"
          ? m.days.map(at)
          : m.days.map((d) => ({ ...d, exercises: d.exercises.map(at) })),
    })),
  }
}

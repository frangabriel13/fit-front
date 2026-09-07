"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import { applyOrders, type Ordered, type OrderedKind } from "@/lib/reorder"
import type { Split } from "@/types/api"

/** Cada nivel cuelga de su propio padre, y el reorden se pide sobre él. */
function endpoint(kind: OrderedKind, parentId: string): string {
  if (kind === "microcycles") return `/splits/${parentId}/microcycles/order`
  if (kind === "days") return `/microcycles/${parentId}/days/order`
  return `/days/${parentId}/exercises/order`
}

/**
 * Mover semanas, días o ejercicios de lugar.
 *
 * Es UNA llamada, no N. Antes se mandaba un `PATCH { order }` por elemento en
 * paralelo, y eso dejó de funcionar cuando el `order` pasó a ser único entre
 * hermanos vivos: en un intercambio de dos vecinos, A(0)→1 choca con B que
 * todavía está en 1, y B(1)→0 choca con A que todavía está en 0. Los dos 409.
 *
 * El endpoint recibe la lista COMPLETA de hermanos en el orden deseado y la
 * aplica en una transacción, así que ya no existe el estado a medio aplicar que
 * obligaba a refetchear después de cada movimiento.
 *
 * `parentId` es de quién son esos hermanos: la rutina para las semanas, el
 * microciclo para los días, el día para los ejercicios. `splitId` es otra cosa —
 * es la clave de la query del editor, que lee la rutina entera de una sola vez.
 */
export function useReorder(
  splitId: string,
  kind: OrderedKind,
  parentId: string
) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.splits.detail(splitId)
  const url = endpoint(kind, parentId)

  return useMutation({
    // Solo viajan los ids: el orden ES la posición en la lista, y los números
    // los reasigna el server con la misma regla que `reorder()` (arrancando en
    // el mínimo que ya había).
    mutationFn: (items: Ordered[]) =>
      unwrap<Ordered[]>(api.put(url, { ids: items.map((i) => i.id) })),

    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<Split>(detailKey)
      if (previous) {
        queryClient.setQueryData<Split>(
          detailKey,
          applyOrders(previous, kind, items)
        )
      }
      return { previous }
    },

    // La respuesta ya trae la colección renumerada, así que no hace falta
    // refetchear: alcanza con escribir SUS números sobre lo que se pintó
    // optimista. Se copian solo los `order` y no la colección entera porque el
    // editor lee un árbol anidado y la respuesta es de un solo nivel — pisarlo
    // se llevaría puestos los hijos.
    onSuccess: (server) => {
      const current = queryClient.getQueryData<Split>(detailKey)
      if (current) {
        queryClient.setQueryData<Split>(
          detailKey,
          applyOrders(
            current,
            kind,
            server.map(({ id, order }) => ({ id, order }))
          )
        )
      }
    },

    // Al fallar no se movió NADA —la transacción es todo o nada—, así que
    // volver al estado anterior es exacto. El refetch igual va: un 400 significa
    // que la lista de hermanos que mandamos no era la que el server tiene
    // (alguien agregó o borró algo en otra pestaña), y eso hay que resincronizarlo.
    onError: (_error, _items, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous)
      queryClient.invalidateQueries({ queryKey: detailKey })
      toast.error("No se pudo mover.")
    },
  })
}

"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import { applyOrders, type OrderedKind, type OrderPatch } from "@/lib/reorder"
import type { Split } from "@/types/api"

/**
 * Mover semanas, días o ejercicios de lugar.
 *
 * La API no tiene endpoint de "reordenar": la posición es un `order` por
 * elemento, así que un movimiento son varios `PATCH`. Salen juntos y la lista
 * se repinta antes de que contesten — mover algo tiene que sentirse inmediato.
 *
 * `kind` es además el segmento de la URL (`/microcycles/:id`, `/days/:id`,
 * `/exercises/:id`), que es la razón de que los tres niveles entren en un solo
 * hook en vez de tres casi iguales.
 */
export function useReorder(splitId: string, kind: OrderedKind) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.splits.detail(splitId)

  return useMutation({
    mutationFn: async (patches: OrderPatch[]) => {
      // `allSettled` y no `all`: con `all` el primer rechazo deja las otras
      // promesas sin dueño y el navegador las reporta como no manejadas.
      const results = await Promise.allSettled(
        patches.map((p) =>
          unwrap(api.patch(`/${kind}/${p.id}`, { order: p.order }))
        )
      )
      if (results.some((r) => r.status === "rejected"))
        throw new Error("No se pudieron aplicar todos los órdenes")
    },
    onMutate: async (patches) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<Split>(detailKey)
      if (previous) {
        queryClient.setQueryData<Split>(
          detailKey,
          applyOrders(previous, kind, patches)
        )
      }
      return { previous }
    },
    onError: (_error, _patches, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous)
      toast.error("No se pudo mover.")
    },
    // Siempre refetch, incluso al fallar: si algunos PATCH entraron y otros no,
    // el orden real del servidor es a medio aplicar y hay que mostrarlo tal
    // cual. Deshacerlo desde acá sería otra tanda de PATCH que también puede
    // fallar.
    onSettled: () => queryClient.invalidateQueries({ queryKey: detailKey }),
  })
}

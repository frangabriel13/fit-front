"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { Split, SplitPayload } from "@/types/api"

/**
 * Las rutinas de quien está logueado, o —con `userId`— las de un cliente de su
 * cartera.
 *
 * `userId` y no `clientId`: la API acepta los dos como alias en los tres
 * endpoints que filtran por persona, y este es el canónico. Antes cada endpoint
 * usaba un nombre distinto y el que no correspondía se descartaba en silencio.
 *
 * Para un cliente devuelve 0 o 1 elemento: la API garantiza que tiene una sola
 * rutina activa. Tomar la primera ya no es una simplificación del front.
 *
 * `enabled` es para los call sites que solo quieren mirar la rutina de alguien
 * en respuesta a algo —el conflicto al asignar—, no en cada render.
 */
export function useSplits(userId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.splits.all(userId),
    queryFn: () =>
      unwrap<Split[]>(
        api.get("/splits", { params: userId ? { userId } : undefined })
      ),
    enabled,
  })
}

export function useSplit(id: string) {
  return useQuery({
    queryKey: queryKeys.splits.detail(id),
    queryFn: () => unwrap<Split>(api.get(`/splits/${id}`)),
    enabled: !!id,
  })
}

export function useCreateSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SplitPayload) =>
      unwrap<Split>(api.post("/splits", payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })
}

export function useUpdateSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: SplitPayload & { id: string }) =>
      unwrap<Split>(api.patch(`/splits/${id}`, payload)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
      queryClient.invalidateQueries({
        queryKey: queryKeys.splits.detail(variables.id),
      })
    },
  })
}

/**
 * Asigna una rutina que YA existe a un cliente (`PATCH /splits/:id {clientId}`).
 *
 * Aparte de `useUpdateSplit` porque acá no se manda el nombre: el PATCH es
 * parcial, y `SplitPayload` obliga a mandarlo. Reenviarlo para asignar sería
 * arriesgarse a pisar el nombre con lo que tenga la caché.
 *
 * Si el cliente ya tiene una rutina activa, la API responde **409** y no crea
 * ni modifica nada — el POST es atómico, así que reintentar después de
 * desasignar es seguro. Para saber cuál tiene, `useSplits(clientId)`: el
 * mensaje del 409 es texto para humanos y no se parsea.
 */
export function useAssignSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId }: { id: string; clientId: string }) =>
      unwrap<Split>(api.patch(`/splits/${id}`, { clientId })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
      queryClient.invalidateQueries({
        queryKey: queryKeys.splits.detail(variables.id),
      })
    },
  })
}

/**
 * Saca una rutina de encima de un cliente
 * (`DELETE /splits/:splitId/assignments/:clientId`, 204).
 *
 * Es el camino inverso que antes no existía, y es lo que hace posible cambiarle
 * la rutina a alguien: asignar una segunda ahora responde 409, así que primero
 * hay que liberar la que tiene.
 */
export function useUnassignSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      splitId,
      clientId,
    }: {
      splitId: string
      clientId: string
    }) =>
      unwrap<void>(api.delete(`/splits/${splitId}/assignments/${clientId}`)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
      queryClient.invalidateQueries({
        queryKey: queryKeys.splits.detail(variables.splitId),
      })
    },
  })
}

export function useDeleteSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/splits/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })
}

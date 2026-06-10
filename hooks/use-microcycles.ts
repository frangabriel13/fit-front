"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { Microcycle, MicrocyclePayload } from "@/types/api"

// Todas las mutaciones reciben splitId para invalidar el árbol ["split", splitId].
function useInvalidateSplit(splitId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.splits.detail(splitId),
    })
}

export function useCreateMicrocycle(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: (payload: MicrocyclePayload) =>
      unwrap<Microcycle>(
        api.post(`/splits/${splitId}/microcycles`, payload)
      ),
    onSuccess: invalidate,
  })
}

export function useUpdateMicrocycle(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: ({ id, ...payload }: MicrocyclePayload & { id: string }) =>
      unwrap<Microcycle>(api.patch(`/microcycles/${id}`, payload)),
    onSuccess: invalidate,
  })
}

export function useDeleteMicrocycle(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/microcycles/${id}`)),
    onSuccess: invalidate,
  })
}

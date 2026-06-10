"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { Day, DayPayload } from "@/types/api"

function useInvalidateSplit(splitId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.splits.detail(splitId),
    })
}

export function useCreateDay(splitId: string, microcycleId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: (payload: DayPayload) =>
      unwrap<Day>(api.post(`/microcycles/${microcycleId}/days`, payload)),
    onSuccess: invalidate,
  })
}

export function useUpdateDay(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: ({ id, ...payload }: DayPayload & { id: string }) =>
      unwrap<Day>(api.patch(`/days/${id}`, payload)),
    onSuccess: invalidate,
  })
}

export function useDeleteDay(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/days/${id}`)),
    onSuccess: invalidate,
  })
}

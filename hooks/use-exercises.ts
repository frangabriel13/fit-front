"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { DayExercise, DayExercisePayload } from "@/types/api"

function useInvalidateSplit(splitId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.splits.detail(splitId),
    })
}

export function useCreateExercise(splitId: string, dayId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: (payload: DayExercisePayload) =>
      unwrap<DayExercise>(api.post(`/days/${dayId}/exercises`, payload)),
    onSuccess: invalidate,
  })
}

export function useUpdateExercise(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: ({ id, ...payload }: DayExercisePayload & { id: string }) =>
      unwrap<DayExercise>(api.patch(`/exercises/${id}`, payload)),
    onSuccess: invalidate,
  })
}

export function useDeleteExercise(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/exercises/${id}`)),
    onSuccess: invalidate,
  })
}

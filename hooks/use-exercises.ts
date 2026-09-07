"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type {
  DayExercise,
  DayExercisePayload,
  ExercisePatch,
} from "@/types/api"

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

/**
 * Editar un ejercicio.
 *
 * Con `applyToAll`, el nombre nuevo se propaga a todas sus apariciones en la
 * rutina — el resto de los campos se aplican solo a este. Invalida la rutina
 * entera y no solo el ejercicio justamente por eso: un renombre propagado toca
 * las tres semanas de una.
 */
export function useUpdateExercise(splitId: string) {
  const invalidate = useInvalidateSplit(splitId)
  return useMutation({
    mutationFn: ({ id, ...patch }: ExercisePatch & { id: string }) =>
      unwrap<DayExercise>(api.patch(`/exercises/${id}`, patch)),
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

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type {
  SetLog,
  SetLogPatch,
  SetLogUpsert,
  WorkoutSession,
} from "@/types/api"

export function useSessions(dayId: string) {
  return useQuery({
    queryKey: queryKeys.sessions.byDay(dayId),
    queryFn: () =>
      unwrap<WorkoutSession[]>(api.get(`/days/${dayId}/sessions`)),
    enabled: !!dayId,
  })
}

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId ?? ""),
    queryFn: () =>
      unwrap<WorkoutSession>(api.get(`/sessions/${sessionId}`)),
    enabled: !!sessionId,
  })
}

export function useCreateSession(dayId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      unwrap<WorkoutSession>(api.post(`/days/${dayId}/sessions`, {})),
    onSuccess: (session) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.byDay(dayId),
      })
      queryClient.setQueryData(
        queryKeys.sessions.detail(session.id),
        session
      )
    },
  })
}

// Upsert en lote de set-logs (PUT /sessions/:id/set-logs) con update optimista.
export function useSaveSetLogs(sessionId: string, dayId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.sessions.detail(sessionId)

  return useMutation({
    mutationFn: (setLogs: SetLogUpsert[]) =>
      unwrap<WorkoutSession>(
        api.put(`/sessions/${sessionId}/set-logs`, { setLogs })
      ),
    onMutate: async (setLogs) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous =
        queryClient.getQueryData<WorkoutSession>(detailKey)

      if (previous) {
        // Reflejo optimista: fusiono los logs enviados sobre los actuales.
        const byKey = new Map<string, SetLog>()
        for (const log of previous.setLogs) {
          byKey.set(`${log.dayExerciseId}:${log.setNumber}`, log)
        }
        for (const upsert of setLogs) {
          const key = `${upsert.dayExerciseId}:${upsert.setNumber}`
          const existing = byKey.get(key)
          byKey.set(key, {
            id: existing?.id ?? `optimistic-${key}`,
            dayExerciseId: upsert.dayExerciseId,
            setNumber: upsert.setNumber,
            actualReps: upsert.actualReps ?? null,
            actualRir: upsert.actualRir ?? null,
            weight: upsert.weight ?? null,
            completed: upsert.completed,
          })
        }
        queryClient.setQueryData<WorkoutSession>(detailKey, {
          ...previous,
          setLogs: Array.from(byKey.values()),
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey })
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.byDay(dayId),
      })
    },
  })
}

// Edición puntual de un set-log existente (PATCH /set-logs/:id).
export function useUpdateSetLog(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: SetLogPatch & { id: string }) =>
      unwrap<SetLog>(api.patch(`/set-logs/${id}`, patch)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
    },
  })
}

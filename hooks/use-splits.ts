"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { Split, SplitPayload } from "@/types/api"

export function useSplits() {
  return useQuery({
    queryKey: queryKeys.splits.all,
    queryFn: () => unwrap<Split[]>(api.get("/splits")),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.splits.all })
    },
  })
}

export function useUpdateSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: SplitPayload & { id: string }) =>
      unwrap<Split>(api.patch(`/splits/${id}`, payload)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.splits.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.splits.detail(variables.id),
      })
    },
  })
}

export function useDeleteSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/splits/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.splits.all })
    },
  })
}

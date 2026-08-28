"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { Split, SplitPayload } from "@/types/api"

/**
 * Las rutinas de quien está logueado, o —con `clientId`— las de un cliente de
 * su cartera. Sin el parámetro se comporta igual que antes.
 */
export function useSplits(clientId?: string) {
  return useQuery({
    queryKey: queryKeys.splits.all(clientId),
    queryFn: () =>
      unwrap<Split[]>(
        api.get("/splits", { params: clientId ? { clientId } : undefined })
      ),
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

export function useDeleteSplit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/splits/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })
}

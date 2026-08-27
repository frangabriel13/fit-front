"use client"

import { useQuery } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { User } from "@/types/api"

/**
 * La cartera de clientes del entrenador logueado.
 *
 * Solo tiene sentido para el rol `trainer`: la API responde 401 a un `client`,
 * así que se habilita desde el call site (`enabled`) en vez de disparar una
 * request que ya sabemos que va a fallar.
 */
export function useClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => unwrap<User[]>(api.get("/clients")),
    enabled,
    staleTime: 5 * 60_000,
  })
}

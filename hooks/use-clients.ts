"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { ClientPayload, User } from "@/types/api"

/**
 * La cartera de clientes del entrenador logueado.
 *
 * Solo tiene sentido para el rol `trainer`: la API responde 403 a un `client`,
 * así que se habilita desde el call site (`enabled`) en vez de disparar una
 * request que ya sabemos que va a fallar.
 *
 * 403 y no 401, y la diferencia importa: el interceptor de `lib/api.ts` solo
 * desloguea ante un 401. Si esto fuera 401, un `client` que llegue acá por
 * error se quedaría sin sesión en vez de ver un vacío.
 */
export function useClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => unwrap<User[]>(api.get("/clients")),
    enabled,
    staleTime: 5 * 60_000,
  })
}

/**
 * Alta de un cliente (`POST /clients`). Solo para `trainer`.
 *
 * Sin update optimista: el id lo pone el servidor y el alta puede rebotar con
 * un 409 por email repetido, que es el caso que hay que mostrar bien. Inventar
 * la fila y sacarla medio segundo después sería peor que esperar.
 */
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientPayload) =>
      unwrap<User>(api.post("/clients", payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

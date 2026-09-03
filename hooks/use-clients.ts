"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { ClientPatch, ClientPayload, User } from "@/types/api"

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

/**
 * Edita un cliente (`PATCH /clients/:id`). Campo ausente = no tocar.
 *
 * El mismo endpoint sirve para renombrar, corregir el email —que la API
 * normaliza sola— y resetear la contraseña. El reset deja al cliente con
 * `mustChangePassword` en `true` otra vez, así que la app le va a volver a
 * pedir que la cambie.
 *
 * Email ya usado responde 409, igual que el alta.
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: ClientPatch & { id: string }) =>
      unwrap<User>(api.patch(`/clients/${id}`, patch)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

/**
 * Da de baja a un cliente (`DELETE /clients/:id`, 204).
 *
 * La baja es lógica: conserva el historial pero le corta el acceso en el acto.
 * Si tenía sesión abierta en otro dispositivo, su próximo request es 401 y el
 * interceptor de `lib/api.ts` lo saca — que es lo correcto.
 *
 * Invalida también las rutinas: el cliente que se va deja de figurar en
 * `Split.clients`.
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap<void>(api.delete(`/clients/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      queryClient.invalidateQueries({ queryKey: ["splits"] })
    },
  })
}

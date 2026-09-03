"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, unwrap } from "@/lib/api"
import { clearToken, getToken, setToken } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  User,
} from "@/types/api"

export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => unwrap<User>(api.get("/auth/me")),
    enabled: typeof window !== "undefined" && getToken() !== null,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      unwrap<LoginResponse>(api.post("/auth/login", payload)),
    onSuccess: (data) => {
      setToken(data.accessToken)
      queryClient.setQueryData(queryKeys.auth.me, data.user)
      // Navegación dura (no router.replace): garantiza que el proxy/middleware
      // vea la cookie recién seteada y evita que el router cache de Next sirva
      // el redirect viejo a /login (que se generó cuando aún no había token).
      window.location.assign("/")
    },
  })
}

/**
 * Cambio de contraseña propio (`POST /auth/change-password`, 204).
 *
 * No cierra la sesión: verificado contra la API, el token emitido antes del
 * cambio sigue siendo válido. Desloguear sería una decisión del front, y acá no
 * hace falta.
 *
 * La contraseña actual equivocada responde **400**, no 401 — importa porque el
 * interceptor de `lib/api.ts` desloguea ante cualquier 401, y equivocarse al
 * tipear no puede costar la sesión.
 */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      unwrap<void>(api.post("/auth/change-password", payload)),
    // `mustChangePassword` se apaga del lado del server con este mismo request,
    // así que hay que volver a pedir /auth/me: si no, el aviso de contraseña
    // provisoria sigue en pantalla hasta que venza la caché.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return () => {
    clearToken()
    queryClient.clear()
    router.replace("/login")
  }
}

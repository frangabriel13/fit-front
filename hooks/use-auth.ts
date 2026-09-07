"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, unwrap } from "@/lib/api"
import {
  clearSession,
  getRefreshToken,
  getToken,
  setTokens,
} from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import type {
  AuthTokens,
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
      setTokens(data)
      queryClient.setQueryData(queryKeys.auth.me, data.user)
      // Navegación dura (no router.replace): garantiza que el proxy/middleware
      // vea la cookie recién seteada y evita que el router cache de Next sirva
      // el redirect viejo a /login (que se generó cuando aún no había token).
      window.location.assign("/")
    },
  })
}

/**
 * Cambio de contraseña propio (`POST /auth/change-password`).
 *
 * Cambiarla **cierra todas las sesiones del usuario, incluida esta**, y por eso
 * la respuesta trae un par de tokens nuevo: es lo que evita que el dispositivo
 * que hizo el cambio quede afuera. Guardarlo es obligatorio, no una mejora — el
 * token anterior ya está muerto y el primer request que salga con él se lleva un
 * 401 que el interceptor de `lib/api.ts` convierte en logout.
 *
 * El orden dentro de `onSuccess` importa por lo mismo: primero el token nuevo,
 * después la invalidación. `mustChangePassword` se apaga del lado del server con
 * este mismo request, así que hay que volver a pedir `/auth/me` —si no, el aviso
 * de contraseña provisoria sigue en pantalla hasta que venza la caché—, y ese
 * refetch sale con lo que haya en la cookie en ese momento.
 *
 * La contraseña actual equivocada responde **400**, no 401 — importa porque el
 * interceptor desloguea ante cualquier 401, y equivocarse al tipear no puede
 * costar la sesión.
 */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      unwrap<AuthTokens>(api.post("/auth/change-password", payload)),
    onSuccess: (tokens) => {
      setTokens(tokens)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

/**
 * Cierra la sesión de ESTE dispositivo.
 *
 * `POST /auth/logout` revoca el refresh del lado del server; sin eso el logout
 * sería solo un borrado de cookies y el token seguiría sirviendo hasta vencer.
 * El access token es stateless y sobrevive igual, pero es el que se acaba de
 * tirar a la basura.
 *
 * El request sale sin esperar respuesta y sin bloquear la salida: cerrar sesión
 * no puede fallar ni quedarse colgado. Si la red no está, lo local se limpia
 * igual — la API responde 204 incluso con un refresh que no existe.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      void api.post("/auth/logout", { refreshToken }).catch(() => {})
    }
    clearSession()
    queryClient.clear()
    router.replace("/login")
  }
}

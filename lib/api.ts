import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios"

import {
  clearSession,
  getRefreshToken,
  getToken,
  setTokens,
} from "@/lib/auth"
import type { AuthTokens } from "@/types/api"

const baseURL = process.env.NEXT_PUBLIC_API_URL

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

/**
 * Instancia pelada para `/auth/refresh`: sin interceptores, para que un 401 del
 * propio refresh no vuelva a entrar acá y se muerda la cola.
 */
const bare = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

/**
 * Donde un 401 ES la respuesta, no un token vencido: credenciales equivocadas
 * en el login, un refresh ya revocado. No se refrescan ni cierran la sesión —
 * de eso se ocupa quien llamó (`login-form` muestra el mensaje, `useLogout`
 * sigue de largo).
 */
const AUTH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout"]

/** Nombre del lock entre pestañas. Es por origen, así que alcanza con que sea único acá. */
const REFRESH_LOCK = "fitfront:refresh"

interface Retriable extends InternalAxiosRequestConfig {
  /** Este request ya se reintentó con un token nuevo. Un segundo 401 es real. */
  retried?: boolean
}

/** El Bearer con el que salió un request, para saber cuál fue el que venció. */
function bearerOf(config: InternalAxiosRequestConfig): string | null {
  const raw = config.headers?.Authorization
  return typeof raw === "string" && raw.startsWith("Bearer ")
    ? raw.slice(7)
    : null
}

/**
 * Canjea el refresh por un par nuevo. Corre con el lock tomado.
 *
 * El refresh **rota**: el que se usa queda revocado. Y reusar uno ya canjeado no
 * da un error cualquiera — el server lo lee como "la cadena se filtró" y cierra
 * TODAS las sesiones del usuario. Por eso lo primero es mirar si la cookie ya
 * tiene otro access token: significa que alguien (otra pestaña, otro request)
 * refrescó mientras esperábamos, y ese par nuevo es el bueno.
 */
async function exchange(expired: string | null): Promise<string | null> {
  const current = getToken()
  if (current && current !== expired) return current

  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const { data } = await bare.post<AuthTokens>("/auth/refresh", { refreshToken })
  setTokens(data)
  return data.accessToken
}

/** Un canje a la vez en esta pestaña; el lock se ocupa de las demás. */
let inFlight: Promise<string | null> | null = null

function refreshSession(expired: string | null): Promise<string | null> {
  if (inFlight) return inFlight

  // `navigator.locks` serializa entre pestañas del mismo origen, que es lo único
  // que evita que dos que vencen a la vez canjeen el MISMO refresh y la segunda
  // termine cerrando todas las sesiones. Sin la API (navegador viejo) queda solo
  // el candado de esta pestaña: peor, pero mejor que no refrescar nunca.
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined
  const run = locks
    ? locks.request(REFRESH_LOCK, () => exchange(expired))
    : exchange(expired)

  inFlight = Promise.resolve(run)
    .catch(() => null)
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

// Request: adjunta el JWT como Bearer en cada llamada.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`)
  }
  return config
})

/**
 * Response: ante un 401, intenta refrescar UNA vez y repetir; si no se puede,
 * limpia la sesión y redirige a `/login` (evitando loops).
 *
 * El reintento es lo que separa "el access token venció" de "esta sesión ya no
 * existe". Sin él, con tokens cortos, cualquier pestaña abierta un rato termina
 * en el login sin motivo.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as Retriable | undefined
    if (error.response?.status !== 401 || typeof window === "undefined")
      return Promise.reject(error)

    const url = config?.url ?? ""
    if (AUTH_PATHS.some((path) => url.startsWith(path)))
      return Promise.reject(error)

    if (config && !config.retried) {
      const token = await refreshSession(bearerOf(config))
      if (token) {
        config.retried = true
        config.headers.set?.("Authorization", `Bearer ${token}`)
        return api.request(config)
      }
    }

    clearSession()
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign("/login")
    }
    return Promise.reject(error)
  }
)

// Helper: desempaqueta response.data tipado.
export async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const res = await promise
  return res.data
}

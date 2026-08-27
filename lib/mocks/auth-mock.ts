// ⚠️  CAPA DE MOCK — TEMPORAL. Borrar cuando exista el backend real.
//
// Activada por NEXT_PUBLIC_USE_MOCKS=true (ver .env.local).
// Intercepta el `adapter` de axios y responde las rutas de auth
// (/auth/login, /auth/me) y /clients con datos hardcodeados. Cualquier otra
// ruta devuelve una respuesta vacía (ver el final del adapter).
//
// No toca hooks ni componentes: el contrato es idéntico al backend real,
// así que para volver a producción alcanza con NEXT_PUBLIC_USE_MOCKS=false
// (o borrar lib/mocks/ y el bloque que lo instala en lib/api.ts).

import {
  AxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"

import type { LoginResponse, User } from "@/types/api"

// ──────────────────────────────────────────────────────────────────────────
//  Usuarios hardcodeados — EDITÁ email / password / name a gusto.
// ──────────────────────────────────────────────────────────────────────────
interface MockUser extends User {
  password: string
}

const MOCK_USERS: MockUser[] = [
  {
    id: "u_admin",
    email: "mansilla.franco.1@gmail.com",
    name: "Franco",
    role: "trainer",
    password: "Frangabriel.13",
  },
  {
    id: "u_client",
    email: "diamela@fitness.com",
    name: "Diamela",
    role: "client",
    password: "Diamela1234",
  },
]

// Token falso: solo encapsula el id del usuario para que /auth/me lo resuelva.
const TOKEN_PREFIX = "mock-token."

const SIMULATED_LATENCY_MS = 450

function publicUser(u: MockUser): User {
  return { id: u.id, email: u.email, name: u.name, role: u.role }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeResponse<T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status = 200
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {},
    config,
  }
}

function unauthorized(config: InternalAxiosRequestConfig): Promise<never> {
  const response = makeResponse(config, { message: "Unauthorized" }, 401)
  return Promise.reject(
    new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, response)
  )
}

/**
 * 403, NO 401. El interceptor de lib/api trata cualquier 401 como sesión
 * vencida: borra el token y manda a /login. "Estás logueado pero no te
 * corresponde" tiene que ser 403 para no cerrarle la sesión al usuario.
 */
function forbidden(config: InternalAxiosRequestConfig): Promise<never> {
  const response = makeResponse(config, { message: "Forbidden" }, 403)
  return Promise.reject(
    new AxiosError("Forbidden", "ERR_BAD_REQUEST", config, null, response)
  )
}

function readAuthHeader(config: InternalAxiosRequestConfig): string {
  const headers = config.headers
  const value =
    headers?.get?.("Authorization") ??
    (headers as Record<string, unknown> | undefined)?.Authorization
  return typeof value === "string" ? value : ""
}

export function installAuthMock(instance: AxiosInstance): void {
  const mockAdapter: AxiosAdapter = async (config) => {
    const url = config.url ?? ""
    const method = (config.method ?? "get").toLowerCase()

    // POST /auth/login
    if (url.endsWith("/auth/login") && method === "post") {
      await delay(SIMULATED_LATENCY_MS)
      const body =
        typeof config.data === "string"
          ? JSON.parse(config.data)
          : config.data ?? {}
      const email = String(body.email ?? "").trim().toLowerCase()
      const password = String(body.password ?? "")
      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email && u.password === password
      )
      if (!user) return unauthorized(config)
      const payload: LoginResponse = {
        accessToken: TOKEN_PREFIX + user.id,
        user: publicUser(user),
      }
      return makeResponse(config, payload)
    }

    // GET /auth/me
    if (url.endsWith("/auth/me") && method === "get") {
      const token = readAuthHeader(config).replace(/^Bearer\s+/i, "")
      if (!token.startsWith(TOKEN_PREFIX)) return unauthorized(config)
      const id = token.slice(TOKEN_PREFIX.length)
      const user = MOCK_USERS.find((u) => u.id === id)
      if (!user) return unauthorized(config)
      await delay(SIMULATED_LATENCY_MS)
      return makeResponse(config, publicUser(user))
    }

    // GET /clients — la cartera del entrenador. Solo un trainer la ve.
    if (url.endsWith("/clients") && method === "get") {
      const token = readAuthHeader(config).replace(/^Bearer\s+/i, "")
      if (!token.startsWith(TOKEN_PREFIX)) return unauthorized(config)
      const me = MOCK_USERS.find((u) => u.id === token.slice(TOKEN_PREFIX.length))
      if (!me) return unauthorized(config)
      if (me.role !== "trainer") return forbidden(config)
      await delay(SIMULATED_LATENCY_MS)
      const clients = MOCK_USERS.filter((u) => u.role === "client").map(publicUser)
      return makeResponse(config, clients)
    }

    // Resto de rutas: con el mock activo aislamos TODO el frontend del backend.
    // NO le pegamos a la red — devolvemos una respuesta vacía 200 para que
    // ninguna llamada no-auth dispare un 401 que cierre la sesión. Cuando exista
    // el backend real, NEXT_PUBLIC_USE_MOCKS=false y estas rutas irán a la API.
    await delay(SIMULATED_LATENCY_MS)
    const empty = method === "get" ? [] : {}
    return makeResponse(config, empty)
  }

  instance.defaults.adapter = mockAdapter
}

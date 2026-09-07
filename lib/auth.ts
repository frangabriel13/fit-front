// Wrapper centralizado para los tokens de sesión.
//
// El ACCESS token se guarda en una cookie NO httpOnly para que:
//  - el interceptor de axios pueda leerla y adjuntar el header Authorization a la API externa.
//  - proxy.ts pueda chequear su presencia y proteger las rutas privadas.
// La API externa NO recibe esta cookie automáticamente: el token viaja solo en el header.
//
// El REFRESH va en su propia cookie y nunca en un header: es la credencial de
// `POST /auth/refresh` y de `POST /auth/logout`, y viaja en el body solo de esas
// dos. Guardarlo aparte es lo que permite cerrar la sesión de verdad — sin él el
// logout es solo del lado del cliente y el token sigue vivo hasta vencer.

export const TOKEN_COOKIE = "fitfront_token"
export const REFRESH_COOKIE = "fitfront_refresh"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 días

function read(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null
}

function write(name: string, value: string): void {
  if (typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

function drop(name: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

export function getToken(): string | null {
  return read(TOKEN_COOKIE)
}

export function getRefreshToken(): string | null {
  return read(REFRESH_COOKIE)
}

export function setToken(token: string): void {
  write(TOKEN_COOKIE, token)
}

/**
 * Guarda el par que devuelven `/auth/login` y `/auth/change-password`.
 *
 * El refresh **rota**: cada canje devuelve uno nuevo y deja muerto al anterior,
 * así que siempre se pisa con el último. Reusar uno ya canjeado cierra todas las
 * sesiones del usuario del lado del server, que es justamente lo que hay que
 * evitar guardando uno solo y siempre el más reciente.
 */
export function setTokens(tokens: {
  accessToken: string
  refreshToken?: string
}): void {
  setToken(tokens.accessToken)
  if (tokens.refreshToken) write(REFRESH_COOKIE, tokens.refreshToken)
}

/** Borra la sesión local entera: sin esto el refresh sobrevive al logout. */
export function clearSession(): void {
  drop(TOKEN_COOKIE)
  drop(REFRESH_COOKIE)
}

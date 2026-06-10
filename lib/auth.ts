// Wrapper centralizado para el JWT.
// Se guarda en una cookie NO httpOnly para que:
//  - el interceptor de axios pueda leerla y adjuntar el header Authorization a la API externa.
//  - proxy.ts pueda chequear su presencia y proteger las rutas privadas.
// La API externa NO recibe esta cookie automáticamente: el token viaja solo en el header.

export const TOKEN_COOKIE = "fitfront_token"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 días

export function getToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null
}

export function setToken(token: string): void {
  if (typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(
    token
  )}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

export function clearToken(): void {
  if (typeof document === "undefined") return
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

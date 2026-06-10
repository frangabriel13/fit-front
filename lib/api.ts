import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios"

import { clearToken, getToken } from "@/lib/auth"

const baseURL = process.env.NEXT_PUBLIC_API_URL

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

// Request: adjunta el JWT como Bearer en cada llamada.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`)
  }
  return config
})

// Response: ante un 401 limpia la sesión y redirige a /login (evitando loops).
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearToken()
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login")
      }
    }
    return Promise.reject(error)
  }
)

// Helper: desempaqueta response.data tipado.
export async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const res = await promise
  return res.data
}

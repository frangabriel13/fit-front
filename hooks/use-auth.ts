"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, unwrap } from "@/lib/api"
import { clearToken, getToken, setToken } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import type { LoginPayload, LoginResponse, User } from "@/types/api"

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
  const router = useRouter()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      unwrap<LoginResponse>(api.post("/auth/login", payload)),
    onSuccess: (data) => {
      setToken(data.accessToken)
      queryClient.setQueryData(queryKeys.auth.me, data.user)
      router.replace("/")
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

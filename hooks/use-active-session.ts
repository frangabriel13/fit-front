"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useCreateSession, useSession, useSessions } from "@/hooks/use-sessions"
import { isToday } from "@/lib/dates"
import type { WorkoutSession } from "@/types/api"

/**
 * Sesión de hoy para un día: la reanuda si ya existe, o crea una.
 *
 * El `ensuredRef` es lo que evita crear dos sesiones: el efecto puede correr
 * más de una vez (StrictMode, refetch de la lista) y la creación es un POST.
 * Si el POST falla se libera, así un reintento posterior puede volver a probar.
 */
export function useActiveSession(dayId: string): {
  sessionId: string | null
  session: WorkoutSession | undefined
  isLoading: boolean
} {
  const sessionsQuery = useSessions(dayId)
  const createSession = useCreateSession(dayId)
  const ensuredRef = useRef(false)
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)

  // Sesión de hoy (si existe) derivada de la lista: la más reciente del día.
  const todaysSessionId = useMemo(() => {
    if (!sessionsQuery.isSuccess) return null
    const todays = sessionsQuery.data
      .filter((s) => isToday(s.performedAt))
      .sort(
        (a, b) =>
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      )[0]
    return todays?.id ?? null
  }, [sessionsQuery.isSuccess, sessionsQuery.data])

  const sessionId = createdSessionId ?? todaysSessionId

  useEffect(() => {
    if (ensuredRef.current) return
    if (!sessionsQuery.isSuccess) return
    if (todaysSessionId) {
      ensuredRef.current = true
      return
    }
    ensuredRef.current = true
    createSession.mutate(undefined, {
      onSuccess: (session) => setCreatedSessionId(session.id),
      onError: () => {
        ensuredRef.current = false
        toast.error("No se pudo iniciar la sesión.")
      },
    })
  }, [sessionsQuery.isSuccess, todaysSessionId, createSession])

  const sessionQuery = useSession(sessionId)

  return {
    sessionId,
    session: sessionQuery.data,
    isLoading:
      sessionsQuery.isLoading ||
      createSession.isPending ||
      (!!sessionId && sessionQuery.isLoading),
  }
}

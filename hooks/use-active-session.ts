"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useCreateSession, useSession, useSessions } from "@/hooks/use-sessions"
import { isToday } from "@/lib/dates"
import type { WorkoutSession } from "@/types/api"

/**
 * La sesión de HOY de un día, si ya existe. No crea nada.
 *
 * Es la versión de solo lectura: la usa el overview de la rutina, que muestra
 * cómo viene el día pero no debería abrir una sesión por el solo hecho de que
 * alguien mire la planilla.
 */
export function useTodaysSession(dayId: string): {
  sessionId: string | null
  session: WorkoutSession | undefined
  isLoading: boolean
  /** La lista del día ya se resolvió bien: recién ahí se sabe si falta crearla. */
  listReady: boolean
} {
  const sessionsQuery = useSessions(dayId)

  // La más reciente de hoy: si se abrieron varias, manda la última.
  const sessionId = useMemo(() => {
    if (!sessionsQuery.isSuccess) return null
    const todays = sessionsQuery.data
      .filter((s) => isToday(s.performedAt))
      .sort(
        (a, b) =>
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      )[0]
    return todays?.id ?? null
  }, [sessionsQuery.isSuccess, sessionsQuery.data])

  const sessionQuery = useSession(sessionId)

  return {
    sessionId,
    session: sessionQuery.data,
    isLoading:
      sessionsQuery.isLoading || (!!sessionId && sessionQuery.isLoading),
    listReady: sessionsQuery.isSuccess,
  }
}

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
  const todays = useTodaysSession(dayId)
  const createSession = useCreateSession(dayId)
  const ensuredRef = useRef(false)
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)

  const sessionId = createdSessionId ?? todays.sessionId

  useEffect(() => {
    if (ensuredRef.current) return
    // Sin lista resuelta no se sabe si falta crearla; con la lista en error,
    // crear a ciegas duplicaría la sesión del día.
    if (!todays.listReady) return
    ensuredRef.current = true
    if (todays.sessionId) return
    createSession.mutate(undefined, {
      onSuccess: (session) => setCreatedSessionId(session.id),
      onError: () => {
        ensuredRef.current = false
        toast.error("No se pudo iniciar la sesión.")
      },
    })
  }, [todays.listReady, todays.sessionId, createSession])

  const createdQuery = useSession(createdSessionId)

  return {
    sessionId,
    session: createdSessionId ? createdQuery.data : todays.session,
    isLoading:
      todays.isLoading ||
      createSession.isPending ||
      (!!createdSessionId && createdQuery.isLoading),
  }
}

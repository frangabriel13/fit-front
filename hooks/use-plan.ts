"use client"

import { useMemo } from "react"

import { historyByName, useProgress } from "@/hooks/use-progress"
import { useSplit, useSplits } from "@/hooks/use-splits"
import { microcycleForWeek, toPlanDays, type PlanDay } from "@/lib/plan"
import type { ExerciseHistory, Split } from "@/types/api"

/**
 * La rutina activa, ya resuelta a los días de la semana en curso.
 *
 * Sin `userId` es la de quien está logueado; con `userId`, la de un cliente de
 * la cartera (el backend lo filtra y verifica que sea tuyo).
 *
 * Son tres llamadas encadenadas (lista → detalle → progreso) y no una, porque
 * la API las expone así. Se juntan acá para que las pantallas pidan "la rutina"
 * y no tengan que saber que un macrociclo son microciclos y que la semana de
 * hoy la decide el progreso.
 *
 * Se toma la PRIMERA rutina de la lista, y eso ahora es exacto y no una
 * simplificación: la API garantiza que un cliente tiene UNA sola rutina activa
 * —asignarle una segunda responde 409— así que la lista trae 0 o 1 elemento.
 *
 * El filtro se llama `userId` en los tres endpoints. La API acepta `clientId`
 * como alias, pero acá se usa uno solo: antes cada endpoint quería un nombre
 * distinto y el que no correspondía se descartaba en silencio.
 */
export function usePlan(userId?: string): {
  split: Split | undefined
  days: PlanDay[]
  week: number
  totalWeeks: number
  history: Record<string, ExerciseHistory>
  isPending: boolean
  isError: boolean
  /** El usuario no tiene ninguna rutina asignada (no es un error). */
  isEmpty: boolean
} {
  const splitsQuery = useSplits(userId)
  const splitId = splitsQuery.data?.[0]?.id ?? ""
  const splitQuery = useSplit(splitId)
  const progressQuery = useProgress(splitId, userId)

  const week = progressQuery.data?.week ?? 1
  const microcycle = useMemo(
    () => microcycleForWeek(splitQuery.data, week),
    [splitQuery.data, week]
  )
  const days = useMemo(() => toPlanDays(microcycle), [microcycle])
  const history = useMemo(
    () => historyByName(progressQuery.data),
    [progressQuery.data]
  )

  const isEmpty = splitsQuery.isSuccess && splitsQuery.data.length === 0
  const isError =
    splitsQuery.isError || splitQuery.isError || progressQuery.isError

  return {
    split: splitQuery.data,
    days,
    week,
    totalWeeks: progressQuery.data?.totalWeeks ?? splitQuery.data?.microcycles.length ?? 0,
    history,
    // El error gana sobre el pendiente: si una de las tres falla, las que
    // dependían de ella se quedan deshabilitadas y por lo tanto "pendientes"
    // para siempre. Sin esto la pantalla mostraría el skeleton sin fin.
    isPending:
      !isError &&
      (splitsQuery.isPending ||
        (!isEmpty && (splitQuery.isPending || progressQuery.isPending))),
    isError,
    isEmpty,
  }
}

"use client"

import { useMemo } from "react"

import { historyByName, useProgress } from "@/hooks/use-progress"
import { useSplit, useSplits } from "@/hooks/use-splits"
import { microcycleForWeek, toPlanDays, type PlanDay } from "@/lib/plan"
import type { ExerciseHistory, Split } from "@/types/api"

/**
 * "Mi rutina": la rutina activa del usuario, ya resuelta a los días de la
 * semana en curso.
 *
 * Son tres llamadas encadenadas (lista → detalle → progreso) y no una, porque
 * la API las expone así. Se juntan acá para que las pantallas pidan "mi rutina"
 * y no tengan que saber que un macrociclo son microciclos y que la semana de
 * hoy la decide el progreso.
 *
 * De momento se toma la PRIMERA rutina de la lista. Cuando un usuario pueda
 * tener varias asignadas a la vez, acá es donde entra el selector.
 */
export function useMyPlan(): {
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
  const splitsQuery = useSplits()
  const splitId = splitsQuery.data?.[0]?.id ?? ""
  const splitQuery = useSplit(splitId)
  const progressQuery = useProgress(splitId)

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

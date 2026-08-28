"use client"

import { Notice } from "@/components/feedback/notice"
import { RoutineHeader } from "@/components/routine/routine-header"
import { RoutineView } from "@/components/routine/routine-view"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyPlan } from "@/hooks/use-my-plan"

function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/** La pantalla de "Mi rutina": trae el plan y lo entrega ya resuelto a la vista. */
export function RoutineScreen() {
  const { split, days, week, totalWeeks, history, isPending, isError, isEmpty } =
    useMyPlan()

  if (isPending) return <Loading />
  if (isError) return <Notice>No se pudo cargar tu rutina.</Notice>
  if (isEmpty || !split)
    return <Notice>Todavía no tenés una rutina asignada.</Notice>
  if (days.length === 0)
    return <Notice>Esta rutina todavía no tiene días cargados.</Notice>

  return (
    <>
      <RoutineHeader
        name={split.name}
        dayCount={days.length}
        week={week}
        totalWeeks={totalWeeks}
      />
      <RoutineView
        days={days}
        history={history}
        week={week}
        totalWeeks={totalWeeks}
      />
    </>
  )
}

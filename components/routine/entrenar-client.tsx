"use client"

import Link from "next/link"
import { useMemo } from "react"

import { Notice } from "@/components/feedback/notice"
import { TrainingScreen } from "@/components/routine/entrenar/training-screen"
import { slotState, toSlots, type EntriesLookup } from "@/components/routine/entrenar/slots"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveSession } from "@/hooks/use-active-session"
import { useMyPlan } from "@/hooks/use-my-plan"
import { toSheetItems } from "@/lib/sheet"
import { entriesFor } from "@/lib/set-logs"

/**
 * Resuelve QUÉ se está entrenando y con qué sesión, y se lo entrega a
 * `TrainingScreen`.
 *
 * El día y el ejercicio salen de la URL (`?dia=…&ej=…`), no de estado interno:
 * así moverse de ejercicio es una navegación de verdad — anda el botón atrás,
 * el link se puede compartir, y cada slot monta con el estado limpio.
 */
export function EntrenarClient({
  dayId,
  exerciseId,
}: {
  dayId: string | null
  exerciseId: string | null
}) {
  const { days, history, week, totalWeeks, isPending, isError, isEmpty } =
    useMyPlan()

  const day = days.find((d) => d.id === dayId) ?? days[0]
  const { sessionId, session, isLoading } = useActiveSession(day?.id ?? "")

  const slots = useMemo(
    () => (day ? toSlots(toSheetItems(day.exercises)) : []),
    [day]
  )

  const entriesOf: EntriesLookup = useMemo(() => {
    const setsById = new Map(day?.exercises.map((e) => [e.id, e.sets]) ?? [])
    return (id: string) =>
      entriesFor(session?.setLogs, id, setsById.get(id) ?? 0)
  }, [day, session])

  // Sin `?ej=` se retoma donde quedó: el primer slot que no esté cerrado.
  const slotIdx = useMemo(() => {
    if (slots.length === 0) return 0
    if (exerciseId) {
      const i = slots.findIndex((s) =>
        s.items.some((it) => it.ex.id === exerciseId)
      )
      if (i >= 0) return i
    }
    const pending = slots.findIndex((s) => slotState(s, entriesOf) !== "done")
    return pending >= 0 ? pending : 0
  }, [slots, exerciseId, entriesOf])

  if (isPending || isLoading) return <LoadingScreen />
  if (isError)
    return <Screen>{<Notice>No se pudo cargar tu rutina.</Notice>}</Screen>
  if (isEmpty || !day)
    return (
      <Screen>
        <Notice>
          No hay ninguna rutina para entrenar.{" "}
          <Link href="/rutina" className="text-primary underline-offset-4 hover:underline">
            Volver a la rutina
          </Link>
        </Notice>
      </Screen>
    )
  if (slots.length === 0)
    return (
      <Screen>
        <Notice>Este día todavía no tiene ejercicios cargados.</Notice>
      </Screen>
    )

  return (
    <TrainingScreen
      key={`${day.id}:${slots[slotIdx].num}`}
      day={day}
      slots={slots}
      slotIdx={slotIdx}
      session={session}
      sessionId={sessionId}
      history={history}
      week={week}
      totalWeeks={totalWeeks}
      entriesOf={entriesOf}
    />
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      {children}
    </main>
  )
}

function LoadingScreen() {
  return (
    <Screen>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </Screen>
  )
}

"use client"

import { useState } from "react"

import { DayTabs } from "@/components/routine/sheet/day-tabs"
import { SessionCard } from "@/components/routine/sheet/session-card"
import { SessionCta } from "@/components/routine/sheet/session-cta"
import { SheetHeader } from "@/components/routine/sheet/sheet-header"
import { SheetRow } from "@/components/routine/sheet/sheet-row"
import { useTodaysSession } from "@/hooks/use-active-session"
import type { PlanDay } from "@/lib/plan"
import { hhmm } from "@/lib/dates"
import { toSheetItems } from "@/lib/sheet"
import { entriesFor } from "@/lib/set-logs"
import { exerciseState } from "@/lib/training-math"
import type { ExerciseHistory } from "@/types/api"

/**
 * Overview de la rutina: la planilla completa del día, con una fila expandible
 * por ejercicio. Este archivo es solo composición — cada pieza vive en
 * `components/routine/sheet/`.
 *
 * Mira la sesión de hoy pero no la crea: entrar a ver la planilla no es empezar
 * a entrenar. La sesión nace recién en `/rutina/entrenar`.
 *
 * En `readOnly` desaparecen todos los caminos a entrenar: un entrenador mirando
 * a un cliente ve el estado del día, no un botón para entrenar por él.
 */
export function RoutineView({
  days,
  history,
  week,
  totalWeeks,
  userId,
  readOnly = false,
}: {
  days: PlanDay[]
  history: Record<string, ExerciseHistory>
  week: number
  totalWeeks: number
  /** De quién son las series que se muestran. Sin esto, las propias. */
  userId?: string
  /** Vista de entrenador: se ve cómo viene el día, pero no se entrena desde acá. */
  readOnly?: boolean
}) {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const day = days[Math.min(active, days.length - 1)]
  const items = toSheetItems(day.exercises)

  const { sessionId, session } = useTodaysSession(day.id, userId)
  const entriesOf = (exerciseId: string, sets: number) =>
    entriesFor(session?.setLogs, exerciseId, sets)

  const hasSession = !!sessionId
  const doneCount = day.exercises.filter(
    (e) => exerciseState(entriesOf(e.id, e.sets)) === "done"
  ).length

  const toggle = (key: string) =>
    setExpanded((cur) => (cur === key ? null : key))

  return (
    <div>
      <DayTabs
        days={days}
        active={active}
        onSelect={(i) => {
          setActive(i)
          setExpanded(null)
        }}
      />

      <SessionCard
        key={`session-${day.id}`}
        day={day}
        hasSession={hasSession}
        startedAt={session ? hhmm(session.performedAt) : null}
        doneCount={doneCount}
        readOnly={readOnly}
      />

      <SheetHeader />

      <ul
        key={`sheet-${day.id}`}
        className="fade-up mt-5 space-y-2 [--delay:60ms] md:mt-0"
      >
        {items.map((item) => (
          <SheetRow
            key={item.ex.id}
            dayId={day.id}
            item={item}
            entries={entriesOf(item.ex.id, item.ex.sets)}
            history={history[item.ex.name]}
            week={week}
            totalWeeks={totalWeeks}
            expanded={expanded === item.ex.id}
            onToggle={() => toggle(item.ex.id)}
            readOnly={readOnly}
          />
        ))}
      </ul>

      {!readOnly && (
        <SessionCta day={day} hasSession={hasSession} doneCount={doneCount} />
      )}
    </div>
  )
}

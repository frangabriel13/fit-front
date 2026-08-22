"use client"

import { useState } from "react"

import { DayTabs } from "@/components/routine/sheet/day-tabs"
import { SessionCard } from "@/components/routine/sheet/session-card"
import { SessionCta } from "@/components/routine/sheet/session-cta"
import { SheetHeader } from "@/components/routine/sheet/sheet-header"
import { SheetRow } from "@/components/routine/sheet/sheet-row"
import { ROUTINE, SESSION } from "@/lib/routine-data"
import { toSheetItems } from "@/lib/sheet"
import { exerciseState } from "@/lib/training-math"

/**
 * Overview de la rutina: la planilla completa del día, con una fila expandible
 * por ejercicio. Este archivo es solo composición — cada pieza vive en
 * `components/routine/sheet/`.
 *
 * Lee datos MOCK de lib/routine-data (ver CLAUDE.md): no hay backend detrás.
 */
export function RoutineView() {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const day = ROUTINE.days[active]
  const items = toSheetItems(day.exercises)

  const hasSession = day.id === SESSION.dayId
  const doneCount = day.exercises.filter(
    (e) => exerciseState(SESSION.logs[e.name]) === "done"
  ).length

  const toggle = (key: string) =>
    setExpanded((cur) => (cur === key ? null : key))

  return (
    <div>
      <DayTabs
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
        doneCount={doneCount}
      />

      <SheetHeader />

      <ul
        key={`sheet-${day.id}`}
        className="fade-up mt-5 space-y-2 [--delay:60ms] md:mt-0"
      >
        {items.map((item) => (
          <SheetRow
            key={item.ex.name}
            item={item}
            expanded={expanded === item.ex.name}
            onToggle={() => toggle(item.ex.name)}
          />
        ))}
      </ul>

      {/* Nota de día de ejemplo (placeholder del mock) */}
      {day.placeholder && (
        <p className="mt-6 rounded-2xl border border-white/8 bg-white/[0.015] px-5 py-4 font-mono text-[11px] text-muted-foreground">
          <span className="mr-2 font-semibold text-primary/90">*</span>
          Día de ejemplo — editalo a gusto.
        </p>
      )}

      <SessionCta day={day} hasSession={hasSession} doneCount={doneCount} />
    </div>
  )
}

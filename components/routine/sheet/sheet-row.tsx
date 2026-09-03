"use client"

import { trainHref } from "@/lib/routes"
import type { SheetItem } from "@/lib/sheet"
import { exerciseState, type SetEntry } from "@/lib/training-math"
import { cn } from "@/lib/utils"
import type { ExerciseHistory } from "@/types/api"
import { COLS } from "./columns"
import { NumberChip } from "./number-chip"
import { RowActions } from "./row-actions"
import { RowDetail } from "./row-detail"

/** Fila de ejercicio: simple, o miembro A/B de una superserie. */
export function SheetRow({
  dayId,
  item,
  entries,
  history,
  week,
  totalWeeks,
  sessionClosed = false,
  expanded,
  onToggle,
  readOnly = false,
}: {
  dayId: string
  item: SheetItem
  entries: SetEntry[]
  history: ExerciseHistory | undefined
  week: number
  totalWeeks: number
  sessionClosed?: boolean
  expanded: boolean
  onToggle: () => void
  readOnly?: boolean
}) {
  const { ex, num, letter, chains } = item
  const state = exerciseState(entries)

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/40 transition-colors",
        expanded ? "border-white/15 bg-card/60" : "border-white/8 hover:border-white/15"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-expanded={expanded}
        aria-label={`Ver detalle de ${ex.name}`}
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-3 outline-none md:px-4",
          COLS
        )}
      >
        <NumberChip num={num} letter={letter} state={state} />

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[15px] font-medium",
              state === "done" ? "text-foreground/65" : "text-foreground"
            )}
          >
            {ex.name}
          </span>
          <span className="mt-1.5 block font-mono text-[12px] text-muted-foreground md:hidden">
            {ex.sets} × {ex.reps} · RIR {ex.effort} ·{" "}
            {chains ? <span className="text-primary/80">→</span> : ex.rest}
          </span>
        </div>

        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {ex.sets}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {ex.reps}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {ex.effort}
        </span>
        <span
          className={cn(
            "hidden text-center font-mono text-[13px] md:block",
            chains ? "text-primary/80" : "text-foreground/90"
          )}
        >
          {chains ? "→" : ex.rest}
        </span>

        {readOnly ? (
          <span className="hidden md:block" />
        ) : (
          <RowActions
            name={ex.name}
            href={trainHref(dayId, ex.id)}
            state={state}
            className="shrink-0"
          />
        )}
      </div>

      {expanded && (
        <RowDetail
          ex={ex}
          dayId={dayId}
          entries={entries}
          history={history}
          week={week}
          totalWeeks={totalWeeks}
          sessionClosed={sessionClosed}
          readOnly={readOnly}
        />
      )}
    </li>
  )
}

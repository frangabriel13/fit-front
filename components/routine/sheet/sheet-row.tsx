"use client"

import { SESSION } from "@/lib/routine-data"
import { sheet, type SheetItem } from "@/lib/sheet"
import { exerciseState } from "@/lib/training-math"
import { cn } from "@/lib/utils"
import { COLS } from "./columns"
import { NumberChip } from "./number-chip"
import { RowActions } from "./row-actions"
import { RowDetail } from "./row-detail"

/** Fila de ejercicio: simple, o miembro A/B de una superserie. */
export function SheetRow({
  item,
  expanded,
  onToggle,
}: {
  item: SheetItem
  expanded: boolean
  onToggle: () => void
}) {
  const { ex, num, letter, chains } = item
  const state = exerciseState(SESSION.logs[ex.name])

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
            {ex.sets} × {sheet(ex.reps)} · RIR {sheet(ex.effort)} ·{" "}
            {chains ? <span className="text-primary/80">→</span> : sheet(ex.rest)}
          </span>
        </div>

        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {ex.sets}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {sheet(ex.reps)}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {sheet(ex.effort)}
        </span>
        <span
          className={cn(
            "hidden text-center font-mono text-[13px] md:block",
            chains ? "text-primary/80" : "text-foreground/90"
          )}
        >
          {chains ? "→" : sheet(ex.rest)}
        </span>

        <RowActions name={ex.name} state={state} className="shrink-0" />
      </div>

      {expanded && <RowDetail ex={ex} />}
    </li>
  )
}

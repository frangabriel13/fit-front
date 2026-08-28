import { RotateCcw, X } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import type { SheetItem } from "@/lib/sheet"
import type { SetEntry, SetStatus } from "@/lib/training-math"
import { cn } from "@/lib/utils"

/** Registro de una serie dentro de una celda de la matriz. */
function SetRecord({ s }: { s: SetEntry }) {
  if (s.status === "done")
    return (
      <span className="text-foreground">
        {s.weight}
        <span className="text-faint"> × </span>
        {s.reps}
      </span>
    )
  if (s.status === "skipped")
    return (
      <span className="text-faint italic line-through decoration-faint">
        omitida
      </span>
    )
  return <span className="text-faint">—</span>
}

/**
 * El registro completo del ejercicio, tocable para corregir. Va debajo del
 * pliegue: arriba queda todo el ciclo de carga.
 */
export function SetMatrix({
  unitStatuses,
  members,
  memberLogs,
  currentRound,
  unit,
  onGoTo,
  onReset,
  onOmit,
}: {
  unitStatuses: SetStatus[]
  members: SheetItem[]
  memberLogs: SetEntry[][]
  currentRound: number
  unit: string
  onGoTo: (round: number) => void
  onReset: (round: number) => void
  onOmit: (round: number) => void
}) {
  const isSuper = members.length > 1

  return (
    <div className="fade-up mt-6 grid grid-cols-3 gap-2 [--delay:200ms]">
      {unitStatuses.map((st, r) => {
        const current = r === currentRound
        const entries = members.map((_, m) => memberLogs[m]?.[r])
        return (
          <div
            key={r}
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border transition-colors",
              current
                ? "border-primary bg-surface-raised"
                : st === "done"
                  ? "border-hairline bg-surface"
                  : st === "skipped"
                    ? "border-hairline bg-surface"
                    : "border-dashed border-hairline bg-surface"
            )}
          >
            <button
              type="button"
              onClick={() => onGoTo(r)}
              className="flex min-h-11 cursor-pointer flex-col px-3 py-2.5 text-left"
            >
              <Eyebrow
                size="sm"
                className={cn(
                  "font-semibold",
                  current
                    ? "text-primary"
                    : st === "done"
                      ? "text-muted-foreground"
                      : "text-faint"
                )}
              >
                {isSuper ? "Vuelta" : "Serie"} {r + 1}
              </Eyebrow>
              <span className="mt-1 block space-y-0.5 font-mono text-[11px] tabular-nums">
                {members.map((it, mi) => (
                  <span key={it.ex.id} className="block truncate">
                    {isSuper && (
                      <span className="mr-1 text-faint">{it.letter}</span>
                    )}
                    <SetRecord s={entries[mi] ?? { status: "pending" }} />
                  </span>
                ))}
              </span>
            </button>

            {/* Acciones a 44px: dos mitades tocables al pie de la celda */}
            {st !== "pending" && (
              <div
                className={cn(
                  "mt-auto grid border-t border-hairline text-faint",
                  st === "done" ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                <button
                  type="button"
                  aria-label={`Resetear ${unit} ${r + 1}`}
                  onClick={() => onReset(r)}
                  className="inline-flex h-11 cursor-pointer items-center justify-center transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                {st === "done" && (
                  <button
                    type="button"
                    aria-label={`Marcar ${unit} ${r + 1} como no hecha`}
                    onClick={() => onOmit(r)}
                    className="inline-flex h-11 cursor-pointer items-center justify-center border-l border-hairline transition-colors hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

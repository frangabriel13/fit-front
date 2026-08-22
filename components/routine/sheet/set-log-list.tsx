import type { SetStatus } from "@/lib/training-math"
import { DeltaChip } from "./delta-chip"
import { SetNode } from "./set-node"
import type { Delta } from "./set-delta"

/**
 * Una línea de planilla, ya normalizada. "Hoy" y "semana anterior" se dibujan
 * exactamente igual — la única diferencia es que la referencia no lleva delta
 * y siempre está cerrada — así que comparten componente en vez de duplicar el
 * <li> entero.
 */
export interface SetLine {
  n: number
  status: SetStatus
  weight?: number
  reps?: number
  rir?: number
  delta?: Delta | null
}

function SetLogRow({ line }: { line: SetLine }) {
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 px-2 py-2.5">
      <span className="flex justify-center">
        <SetNode n={line.n} status={line.status} />
      </span>

      {line.status === "done" ? (
        <div className="flex min-w-0 items-baseline gap-x-2">
          <span className="font-mono text-[15px] tabular-nums whitespace-nowrap text-foreground">
            <span className="font-semibold">{line.weight}</span>
            <span className="text-[10px] text-muted-foreground/70"> kg</span>
            <span className="text-muted-foreground"> × {line.reps}</span>
          </span>
          {line.rir != null && (
            <span className="font-mono text-[10px] whitespace-nowrap text-muted-foreground/55">
              RIR {line.rir}
            </span>
          )}
          {line.delta && <DeltaChip d={line.delta} />}
        </div>
      ) : line.status === "skipped" ? (
        <span className="font-mono text-[12px] text-muted-foreground italic line-through decoration-muted-foreground/40">
          omitida
        </span>
      ) : (
        <span className="font-mono text-[12px] text-muted-foreground/45">
          pendiente
        </span>
      )}
    </li>
  )
}

/** Montar con `key` distinta por vista: es lo que dispara de nuevo el fade-up. */
export function SetLogList({ lines }: { lines: SetLine[] }) {
  return (
    <ul className="fade-up divide-y divide-border/50">
      {lines.map((line) => (
        <SetLogRow key={line.n} line={line} />
      ))}
    </ul>
  )
}

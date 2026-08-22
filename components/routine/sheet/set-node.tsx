import type { SetEntry } from "@/lib/training-math"
import { cn } from "@/lib/utils"

/** Nodo con el número de serie, coloreado por estado. */
export function SetNode({ n, status }: { n: number; status: SetEntry["status"] }) {
  return (
    <span
      className={cn(
        "grid size-6 place-items-center rounded-md font-mono text-[10px] font-medium tabular-nums ring-1 ring-inset",
        status === "done" && "bg-primary/15 text-primary ring-primary/35",
        status === "skipped" && "bg-secondary text-muted-foreground/70 ring-border",
        status === "pending" && "bg-secondary/50 text-muted-foreground/50 ring-border/60"
      )}
    >
      {n}
    </span>
  )
}

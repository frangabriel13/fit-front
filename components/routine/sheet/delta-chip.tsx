import { ArrowDown, ArrowUp, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Delta } from "./set-delta"

/** El progreso de una serie contra la misma serie de la semana pasada. */
export function DeltaChip({ d }: { d: Delta }) {
  const Icon = d.dir === "up" ? ArrowUp : d.dir === "down" ? ArrowDown : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
        d.dir === "up" && "bg-primary/15 text-primary",
        d.dir === "down" && "bg-ember/15 text-ember",
        d.dir === "flat" && "bg-secondary text-muted-foreground"
      )}
    >
      <Icon className="size-2.5" strokeWidth={2.5} />
      {d.value}
      {d.unit && <span className="opacity-70">{d.unit}</span>}
    </span>
  )
}

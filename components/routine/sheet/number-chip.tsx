import { Check } from "lucide-react"

import type { ExerciseState } from "@/lib/training-math"
import { cn } from "@/lib/utils"

/** Indicador de estado: chip de número que pasa a tilde cuando está hecho. */
export function NumberChip({
  num,
  letter,
  state,
}: {
  num: string
  letter?: string
  state: ExerciseState
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl font-display text-base leading-none ring-1 transition-colors",
        state === "done" && "bg-primary/15 text-primary ring-primary/30",
        state === "in-progress" && "bg-ember/15 text-ember ring-ember/35",
        state === "pending" && "bg-white/[0.04] text-muted-foreground ring-white/10"
      )}
    >
      {state === "done" ? (
        <Check className="size-5" strokeWidth={2.5} />
      ) : (
        <>
          {num}
          {letter && (
            <span className="ml-0.5 text-[0.7em] opacity-70">{letter}</span>
          )}
        </>
      )}
    </span>
  )
}

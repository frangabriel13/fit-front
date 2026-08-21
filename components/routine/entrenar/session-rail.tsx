import type { ExerciseState } from "@/lib/training-math"
import { cn } from "@/lib/utils"
import { slotState, type Slot } from "./slots"

/** Progreso del día: un segmento por slot, el actual más alto y en acento. */
export function SessionRail({
  slots,
  activeIndex,
  activeState,
}: {
  slots: Slot[]
  activeIndex: number
  activeState: ExerciseState
}) {
  return (
    <div className="fade-up flex items-center gap-1.5 py-3">
      {slots.map((s, i) => {
        const current = i === activeIndex
        const st = current ? activeState : slotState(s)
        return (
          <span
            key={s.num}
            aria-hidden
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              current
                ? "h-2 bg-primary"
                : st === "done"
                  ? "bg-done"
                  : st === "in-progress"
                    ? "bg-edge"
                    : "bg-hairline"
            )}
          />
        )
      })}
    </div>
  )
}

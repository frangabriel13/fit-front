"use client"

import { Eyebrow } from "@/components/typography/eyebrow"
import { cn } from "@/lib/utils"

/** El RIR en palabras: el número solo no dice cuánto te quedó en el tanque. */
const RIR_WORDS = ["al fallo", "casi al fallo", "exigente", "cómoda", "sobra"]

/** RIR como fila de pastillas: la elegida se rellena, el resto queda plano. */
export function RirScale({
  value,
  onPick,
}: {
  value: number | null
  onPick: (n: number) => void
}) {
  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <div className="flex items-baseline justify-between">
        <Eyebrow size="sm" className="font-semibold text-faint">
          RIR
        </Eyebrow>
        <Eyebrow size="sm" tone="meta" className="text-primary">
          {value != null ? RIR_WORDS[value] : "sin marcar"}
        </Eyebrow>
      </div>
      <div className="mt-2.5 grid grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map((n) => {
          const on = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              aria-pressed={on}
              className={cn(
                "flex h-12 cursor-pointer items-center justify-center rounded-xl border font-mono text-[15px] tabular-nums transition-colors",
                on
                  ? "border-primary bg-primary font-bold text-primary-foreground"
                  : "border-hairline bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

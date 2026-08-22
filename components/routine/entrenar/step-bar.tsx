"use client"

import { Minus, Plus } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { cn } from "@/lib/utils"
import type { Field } from "./types"


/** Pasos ofrecidos por celda: kilos finos para el peso, enteros para las reps. */
const STEPS: Record<Field, number[]> = {
  weight: [0.5, 1, 2.5],
  reps: [1, 2, 5],
}

/** Stepper único: [− · pasos · +]. Los pasos dependen de la celda enfocada. */
export function StepBar({
  field,
  step,
  onStep,
  onInc,
  onDec,
  canDec,
}: {
  field: Field
  step: number
  onStep: (v: number) => void
  onInc: () => void
  onDec: () => void
  canDec: boolean
}) {
  return (
    <>
      <div className="mt-2.5 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2.5">
        <button
          type="button"
          aria-label={field === "weight" ? "Bajar peso" : "Bajar repeticiones"}
          onClick={onDec}
          disabled={!canDec}
          className="flex h-14 items-center justify-center rounded-2xl border border-edge bg-surface text-muted-foreground transition-colors enabled:cursor-pointer enabled:hover:border-primary enabled:hover:text-foreground disabled:opacity-35"
        >
          <Minus className="size-5" />
        </button>

        <div className="grid grid-cols-3 gap-1.5">
          {STEPS[field].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onStep(v)}
              aria-pressed={step === v}
              className={cn(
                "flex h-14 cursor-pointer items-center justify-center rounded-xl border font-mono text-xs font-semibold tabular-nums transition-colors",
                step === v
                  ? "border-primary bg-surface-raised text-foreground"
                  : "border-hairline bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              ± {v}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label={field === "weight" ? "Subir peso" : "Subir repeticiones"}
          onClick={onInc}
          className="flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-primary bg-surface-raised text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-5" />
        </button>
      </div>
      <Eyebrow as="p" size="sm" tone="action" className="mt-2 text-center text-faint">
        el control ajusta {field === "weight" ? "el peso" : "las repeticiones"}
      </Eyebrow>
    </>
  )
}

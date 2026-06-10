"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export interface RowState {
  actualReps: string
  actualRir: string
  weight: string
  completed: boolean
}

interface SetRowProps {
  setNumber: number
  value: RowState
  onFieldChange: (field: keyof RowState, value: string) => void
  onToggleComplete: (completed: boolean) => void
}

export function SetRow({
  setNumber,
  value,
  onFieldChange,
  onToggleComplete,
}: SetRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1.5rem_1fr_1fr_1fr_auto] items-center gap-2 rounded-md border p-2",
        value.completed && "border-green-600/40 bg-green-600/5"
      )}
    >
      <span className="text-center text-sm font-medium text-muted-foreground">
        {setNumber}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="reps"
        aria-label={`Serie ${setNumber} repeticiones`}
        value={value.actualReps}
        onChange={(e) => onFieldChange("actualReps", e.target.value)}
        className="h-10 text-center"
      />
      <Input
        type="number"
        inputMode="decimal"
        placeholder="peso"
        aria-label={`Serie ${setNumber} peso`}
        value={value.weight}
        onChange={(e) => onFieldChange("weight", e.target.value)}
        className="h-10 text-center"
      />
      <Input
        type="number"
        inputMode="decimal"
        placeholder="RIR"
        aria-label={`Serie ${setNumber} RIR`}
        value={value.actualRir}
        onChange={(e) => onFieldChange("actualRir", e.target.value)}
        className="h-10 text-center"
      />
      <Checkbox
        checked={value.completed}
        onCheckedChange={(checked) => onToggleComplete(checked === true)}
        aria-label={`Serie ${setNumber} completada`}
        className="size-6"
      />
    </div>
  )
}

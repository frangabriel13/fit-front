"use client"

import type { DayExercise } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SetRow, type RowState } from "@/components/workout/set-row"

interface ExerciseBlockProps {
  exercise: DayExercise
  rowCount: number
  getRow: (setNumber: number) => RowState
  onFieldChange: (
    setNumber: number,
    field: keyof RowState,
    value: string
  ) => void
  onToggleComplete: (setNumber: number, completed: boolean) => void
}

export function ExerciseBlock({
  exercise,
  rowCount,
  getRow,
  onFieldChange,
  onToggleComplete,
}: ExerciseBlockProps) {
  const setNumbers = Array.from({ length: rowCount }, (_, i) => i + 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{exercise.name}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{exercise.targetSets} series</Badge>
          {exercise.targetRir != null && (
            <Badge variant="outline">RIR {exercise.targetRir}</Badge>
          )}
          {exercise.targetRestSeconds != null && (
            <Badge variant="outline">
              {exercise.targetRestSeconds}s descanso
            </Badge>
          )}
        </div>
        {exercise.notes && (
          <p className="text-sm text-muted-foreground">{exercise.notes}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_auto] gap-2 px-2 text-center text-xs text-muted-foreground">
          <span>#</span>
          <span>Reps</span>
          <span>Peso</span>
          <span>RIR</span>
          <span className="w-6">✓</span>
        </div>
        {setNumbers.map((setNumber) => (
          <SetRow
            key={setNumber}
            setNumber={setNumber}
            value={getRow(setNumber)}
            onFieldChange={(field, value) =>
              onFieldChange(setNumber, field, value)
            }
            onToggleComplete={(completed) =>
              onToggleComplete(setNumber, completed)
            }
          />
        ))}
      </CardContent>
    </Card>
  )
}

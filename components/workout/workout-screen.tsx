"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/workout/empty-state"
import { ExerciseBlock } from "@/components/workout/exercise-block"
import { SaveIndicator } from "@/components/workout/save-indicator"
import { SessionHistorySheet } from "@/components/workout/session-history-sheet"
import { useActiveSession } from "@/hooks/use-active-session"
import { useSetLogGrid } from "@/hooks/use-set-log-grid"
import { useSplit } from "@/hooks/use-splits"
import type { Day } from "@/types/api"

/**
 * Modo entrenamiento contra la API.
 *
 * Composición: el ciclo de vida de la sesión vive en `use-active-session`
 * (crear o reanudar la de hoy) y la grilla con autoguardado en
 * `use-set-log-grid`. Acá queda el armado de la pantalla.
 */
export function WorkoutScreen({
  splitId,
  dayId,
}: {
  splitId: string
  dayId: string
}) {
  const { data: split, isLoading: loadingSplit } = useSplit(splitId)

  const day: Day | undefined = useMemo(
    () => split?.microcycles.flatMap((m) => m.days).find((d) => d.id === dayId),
    [split, dayId]
  )
  const exercises = useMemo(
    () => [...(day?.exercises ?? [])].sort((a, b) => a.order - b.order),
    [day]
  )

  const { sessionId, session, isLoading: loadingSession } =
    useActiveSession(dayId)

  const grid = useSetLogGrid({ sessionId, dayId, exercises, session })

  const isPreparing = loadingSplit || loadingSession

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/splits/${splitId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        {day && <SessionHistorySheet dayId={dayId} exercises={exercises} />}
      </div>

      {day && (
        <div>
          <h1 className="text-xl font-semibold">{day.name}</h1>
          <p className="text-sm text-muted-foreground">Modo entrenamiento</p>
        </div>
      )}

      {isPreparing && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isPreparing && !day && <EmptyState>No se encontró este día.</EmptyState>}

      {!isPreparing && day && exercises.length === 0 && (
        <EmptyState>
          Este día no tiene ejercicios. Agregalos desde el editor.
        </EmptyState>
      )}

      {!isPreparing && day && exercises.length > 0 && (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseBlock
              key={exercise.id}
              exercise={exercise}
              rowCount={grid.rowCounts[exercise.id] ?? exercise.targetSets}
              getRow={grid.getRow(exercise.id)}
              onFieldChange={(setNumber, field, value) =>
                grid.onFieldChange(exercise.id, setNumber, field, value)
              }
              onToggleComplete={(setNumber, completed) =>
                grid.onToggleComplete(exercise.id, setNumber, completed)
              }
            />
          ))}
        </div>
      )}

      {/* Indicador de guardado fijo abajo */}
      {sessionId && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-end px-4 py-3">
            <SaveIndicator status={grid.status} onRetry={grid.retry} />
          </div>
        </div>
      )}
    </div>
  )
}

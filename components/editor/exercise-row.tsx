"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { DayExercise } from "@/types/api"
import { useDeleteExercise } from "@/hooks/use-exercises"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExerciseFormDialog } from "@/components/editor/exercise-form-dialog"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"

interface ExerciseRowProps {
  splitId: string
  dayId: string
  exercise: DayExercise
}

export function ExerciseRow({ splitId, dayId, exercise }: ExerciseRowProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteExercise = useDeleteExercise(splitId)

  function onConfirmDelete() {
    deleteExercise.mutate(exercise.id, {
      onSuccess: () => {
        toast.success("Ejercicio borrado")
        setDeleteOpen(false)
      },
      onError: () => toast.error("No se pudo borrar el ejercicio."),
    })
  }

  return (
    <>
      <div className="flex items-start justify-between gap-2 rounded-md border bg-card p-3">
        <div className="min-w-0 space-y-1.5">
          <p className="font-medium leading-tight">{exercise.name}</p>
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
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            aria-label="Editar ejercicio"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            aria-label="Borrar ejercicio"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <ExerciseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        splitId={splitId}
        dayId={dayId}
        exercise={exercise}
        defaultOrder={exercise.order}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Borrar ejercicio?"
        description={`Se va a borrar "${exercise.name}".`}
        onConfirm={onConfirmDelete}
        isPending={deleteExercise.isPending}
      />
    </>
  )
}

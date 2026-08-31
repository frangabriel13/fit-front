"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ExerciseFormDialog } from "@/components/editor/exercise-form-dialog"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"
import { Eyebrow } from "@/components/typography/eyebrow"
import { useDeleteExercise } from "@/hooks/use-exercises"
import { toPlanExercise } from "@/lib/plan"
import type { DayExercise } from "@/types/api"

interface ExerciseRowProps {
  splitId: string
  dayId: string
  exercise: DayExercise
}

/**
 * Un ejercicio dentro del día, en el editor.
 *
 * Muestra los objetivos con `toPlanExercise`, o sea EXACTAMENTE el mismo texto
 * que va a leer quien entrene ("4 × 8-10 · RIR 1-2 · 2'30''"). Antes eran
 * badges con los números crudos de la base, y el entrenador no tenía forma de
 * saber cómo iba a quedar lo que estaba pautando.
 */
export function ExerciseRow({ splitId, dayId, exercise }: ExerciseRowProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteExercise = useDeleteExercise(splitId)

  const plan = toPlanExercise(exercise)

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
      <div className="flex items-start justify-between gap-2 rounded-xl border border-hairline bg-surface-raised px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            {plan.superset && (
              <Eyebrow size="sm" tone="meta" className="shrink-0 text-primary">
                {plan.superset}
              </Eyebrow>
            )}
            <span className="truncate text-[15px] leading-tight font-medium">
              {plan.name}
            </span>
          </p>
          <p className="mt-1.5 font-mono text-[12px] text-muted-foreground">
            {plan.sets} × {plan.reps} · RIR {plan.effort} · desc {plan.rest}
          </p>
          {plan.notes && (
            <p className="mt-1.5 text-[13px] text-faint">{plan.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Editar ejercicio"
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Borrar ejercicio"
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
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

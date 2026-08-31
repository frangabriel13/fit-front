"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DayFormDialog } from "@/components/editor/day-form-dialog"
import { ExerciseFormDialog } from "@/components/editor/exercise-form-dialog"
import { ExerciseRow } from "@/components/editor/exercise-row"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"
import { Eyebrow } from "@/components/typography/eyebrow"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useDeleteDay } from "@/hooks/use-days"
import type { Day } from "@/types/api"

interface DaySectionProps {
  splitId: string
  microcycleId: string
  day: Day
}

export function DaySection({ splitId, microcycleId, day }: DaySectionProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const deleteDay = useDeleteDay(splitId)

  const exercises = [...(day.exercises ?? [])].sort((a, b) => a.order - b.order)
  const nextOrder =
    exercises.length > 0 ? Math.max(...exercises.map((e) => e.order)) + 1 : 0

  function onConfirmDelete() {
    deleteDay.mutate(day.id, {
      onSuccess: () => {
        toast.success("Día borrado")
        setDeleteOpen(false)
      },
      onError: () => toast.error("No se pudo borrar el día."),
    })
  }

  return (
    <AccordionItem value={day.id} className="border-b-0">
      <div className="flex items-center gap-1">
        <AccordionTrigger className="min-w-0 flex-1 py-3 hover:no-underline">
          <span className="min-w-0 text-left">
            <span className="flex items-baseline gap-2">
              <Eyebrow size="sm" tone="meta" className="text-faint">
                {String(day.order).padStart(2, "0")}
              </Eyebrow>
              <span className="truncate font-display text-base leading-none uppercase">
                {day.name}
              </span>
            </span>
            <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">
              {exercises.length}{" "}
              {exercises.length === 1 ? "ejercicio" : "ejercicios"}
              {day.focus && ` · ${day.focus}`}
            </span>
          </span>
        </AccordionTrigger>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Editar día"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label="Borrar día"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <AccordionContent>
        <div className="space-y-2 pb-1">
          {exercises.length === 0 ? (
            <p className="py-2 text-[13px] text-muted-foreground">
              Sin ejercicios todavía.
            </p>
          ) : (
            exercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                splitId={splitId}
                dayId={day.id}
                exercise={exercise}
              />
            ))
          )}

          <button
            type="button"
            onClick={() => setAddExerciseOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hairline py-2.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-edge hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Agregar ejercicio
          </button>
        </div>
      </AccordionContent>

      <DayFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        splitId={splitId}
        microcycleId={microcycleId}
        day={day}
        defaultOrder={day.order}
      />
      <ExerciseFormDialog
        open={addExerciseOpen}
        onOpenChange={setAddExerciseOpen}
        splitId={splitId}
        dayId={day.id}
        defaultOrder={nextOrder}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Borrar día?"
        description={`Se va a borrar "${day.name}" y sus ejercicios.`}
        onConfirm={onConfirmDelete}
        isPending={deleteDay.isPending}
      />
    </AccordionItem>
  )
}

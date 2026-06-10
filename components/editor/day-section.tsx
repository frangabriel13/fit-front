"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2, Plus, Play } from "lucide-react"
import { toast } from "sonner"

import type { Day } from "@/types/api"
import { useDeleteDay } from "@/hooks/use-days"
import { Button } from "@/components/ui/button"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ExerciseRow } from "@/components/editor/exercise-row"
import { ExerciseFormDialog } from "@/components/editor/exercise-form-dialog"
import { DayFormDialog } from "@/components/editor/day-form-dialog"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"

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
    exercises.length > 0
      ? Math.max(...exercises.map((e) => e.order)) + 1
      : 0

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
      <div className="flex items-center gap-1 pr-1">
        <AccordionTrigger className="flex-1 px-2">
          {day.name}
        </AccordionTrigger>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditOpen(true)}
          aria-label="Editar día"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          aria-label="Borrar día"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <AccordionContent className="px-2">
        <div className="space-y-2">
          <Button asChild size="sm" className="w-full">
            <Link href={`/splits/${splitId}/days/${day.id}/workout`}>
              <Play className="size-4" />
              Entrenar este día
            </Link>
          </Button>

          {exercises.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Sin ejercicios todavía.
            </p>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  splitId={splitId}
                  dayId={day.id}
                  exercise={exercise}
                />
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setAddExerciseOpen(true)}
          >
            <Plus className="size-4" />
            Agregar ejercicio
          </Button>
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

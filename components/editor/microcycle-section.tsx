"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

import type { Microcycle } from "@/types/api"
import { useDeleteMicrocycle } from "@/hooks/use-microcycles"
import { Button } from "@/components/ui/button"
import { Accordion } from "@/components/ui/accordion"
import { DaySection } from "@/components/editor/day-section"
import { MicrocycleFormDialog } from "@/components/editor/microcycle-form-dialog"
import { DayFormDialog } from "@/components/editor/day-form-dialog"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"

interface MicrocycleSectionProps {
  splitId: string
  microcycle: Microcycle
}

export function MicrocycleSection({
  splitId,
  microcycle,
}: MicrocycleSectionProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addDayOpen, setAddDayOpen] = useState(false)
  const deleteMicrocycle = useDeleteMicrocycle(splitId)

  const days = [...(microcycle.days ?? [])].sort((a, b) => a.order - b.order)
  const nextOrder =
    days.length > 0 ? Math.max(...days.map((d) => d.order)) + 1 : 0

  function onConfirmDelete() {
    deleteMicrocycle.mutate(microcycle.id, {
      onSuccess: () => {
        toast.success("Microciclo borrado")
        setDeleteOpen(false)
      },
      onError: () => toast.error("No se pudo borrar el microciclo."),
    })
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-1 px-2">
        <h2 className="flex-1 truncate py-3 font-semibold">
          {microcycle.name}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditOpen(true)}
          aria-label="Editar microciclo"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          aria-label="Borrar microciclo"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="border-t px-2 pb-3">
        {days.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Sin días todavía.
          </p>
        ) : (
          <Accordion type="multiple" className="divide-y">
            {days.map((day) => (
              <DaySection
                key={day.id}
                splitId={splitId}
                microcycleId={microcycle.id}
                day={day}
              />
            ))}
          </Accordion>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => setAddDayOpen(true)}
        >
          <Plus className="size-4" />
          Agregar día
        </Button>
      </div>

      <MicrocycleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        splitId={splitId}
        microcycle={microcycle}
        defaultOrder={microcycle.order}
      />
      <DayFormDialog
        open={addDayOpen}
        onOpenChange={setAddDayOpen}
        splitId={splitId}
        microcycleId={microcycle.id}
        defaultOrder={nextOrder}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Borrar microciclo?"
        description={`Se va a borrar "${microcycle.name}" con sus días y ejercicios.`}
        onConfirm={onConfirmDelete}
        isPending={deleteMicrocycle.isPending}
      />
    </div>
  )
}

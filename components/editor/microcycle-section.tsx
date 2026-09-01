"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DayFormDialog } from "@/components/editor/day-form-dialog"
import { DaySection } from "@/components/editor/day-section"
import { MicrocycleFormDialog } from "@/components/editor/microcycle-form-dialog"
import { ReorderButtons } from "@/components/editor/reorder-buttons"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Accordion } from "@/components/ui/accordion"
import { useDeleteMicrocycle } from "@/hooks/use-microcycles"
import { useReorder } from "@/hooks/use-reorder"
import { reorder } from "@/lib/reorder"
import type { Microcycle } from "@/types/api"

interface MicrocycleSectionProps {
  splitId: string
  microcycle: Microcycle
  index?: number
  canUp: boolean
  canDown: boolean
  onMove: (dir: -1 | 1) => void
}

export function MicrocycleSection({
  splitId,
  microcycle,
  index = 0,
  canUp,
  canDown,
  onMove,
}: MicrocycleSectionProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addDayOpen, setAddDayOpen] = useState(false)
  const deleteMicrocycle = useDeleteMicrocycle(splitId)
  const reorderDays = useReorder(splitId, "days")

  const days = [...(microcycle.days ?? [])].sort((a, b) => a.order - b.order)
  const nextOrder =
    days.length > 0 ? Math.max(...days.map((d) => d.order)) + 1 : 0

  function moveDay(i: number, dir: -1 | 1) {
    const { patches } = reorder(days, i, dir)
    if (patches.length > 0) reorderDays.mutate(patches)
  }

  function onConfirmDelete() {
    deleteMicrocycle.mutate(microcycle.id, {
      onSuccess: () => {
        toast.success("Semana borrada")
        setDeleteOpen(false)
      },
      onError: () => toast.error("No se pudo borrar la semana."),
    })
  }

  return (
    <div
      style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
      className="fade-up overflow-hidden rounded-2xl border border-hairline bg-surface"
    >
      <div className="flex items-center gap-1 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <Eyebrow as="p" size="sm" tone="meta" className="text-faint">
            Semana {String(microcycle.order).padStart(2, "0")}
          </Eyebrow>
          <h2 className="mt-1 truncate font-display text-lg leading-none uppercase">
            {microcycle.name}
          </h2>
        </div>
        <ReorderButtons
          label="semana"
          canUp={canUp}
          canDown={canDown}
          onMove={onMove}
        />
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Editar semana"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label="Borrar semana"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="border-t border-hairline px-4 pt-1 pb-4">
        {days.length === 0 ? (
          <p className="py-3 text-[13px] text-muted-foreground">
            Sin días todavía.
          </p>
        ) : (
          <Accordion type="multiple" className="divide-y divide-hairline">
            {days.map((day, i) => (
              <DaySection
                key={day.id}
                splitId={splitId}
                microcycleId={microcycle.id}
                day={day}
                canUp={i > 0}
                canDown={i < days.length - 1}
                onMove={(dir) => moveDay(i, dir)}
              />
            ))}
          </Accordion>
        )}

        <button
          type="button"
          onClick={() => setAddDayOpen(true)}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hairline py-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-edge hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Agregar día
        </button>
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
        title="¿Borrar semana?"
        description={`Se va a borrar "${microcycle.name}" con sus días y ejercicios.`}
        onConfirm={onConfirmDelete}
        isPending={deleteMicrocycle.isPending}
      />
    </div>
  )
}

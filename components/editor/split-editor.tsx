"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Notice } from "@/components/feedback/notice"
import { MicrocycleFormDialog } from "@/components/editor/microcycle-form-dialog"
import { MicrocycleSection } from "@/components/editor/microcycle-section"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"
import { SplitFormDialog } from "@/components/splits/split-form-dialog"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteSplit, useSplit } from "@/hooks/use-splits"

/** Botón de acción secundaria del editor: ícono suelto, sin peso visual. */
function IconAction({
  label,
  onClick,
  children,
  destructive = false,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors ${
        destructive ? "hover:text-destructive" : "hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

export function SplitEditor({ splitId }: { splitId: string }) {
  const router = useRouter()
  const { data: split, isLoading, isError, refetch } = useSplit(splitId)
  const deleteSplit = useDeleteSplit()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addMicroOpen, setAddMicroOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !split) {
    return (
      <Notice>
        <p>No se pudo cargar la rutina.</p>
        <Button
          variant="outline"
          className="mt-3 h-9 px-4 text-[10px] tracking-[0.16em] uppercase"
          onClick={() => refetch()}
        >
          Reintentar
        </Button>
      </Notice>
    )
  }

  const microcycles = [...(split.microcycles ?? [])].sort(
    (a, b) => a.order - b.order
  )
  const nextOrder =
    microcycles.length > 0 ? Math.max(...microcycles.map((m) => m.order)) + 1 : 0

  function onConfirmDelete() {
    deleteSplit.mutate(splitId, {
      onSuccess: () => {
        toast.success("Rutina borrada")
        router.replace("/splits")
      },
      onError: () => toast.error("No se pudo borrar la rutina."),
    })
  }

  return (
    <div>
      <Link
        href="/splits"
        className="fade-up mb-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Mis rutinas
      </Link>

      <div className="fade-up mb-7 flex items-start justify-between gap-3 [--delay:60ms]">
        <div className="min-w-0">
          <Eyebrow as="p" className="font-semibold text-primary">
            Editando
          </Eyebrow>
          <h1 className="mt-1.5 truncate font-display text-4xl leading-none uppercase lg:text-5xl">
            {split.name}
          </h1>
          {split.description && (
            <p className="mt-2.5 text-sm text-muted-foreground">
              {split.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconAction label="Editar rutina" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
          </IconAction>
          <IconAction
            label="Borrar rutina"
            destructive
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </IconAction>
        </div>
      </div>

      {microcycles.length === 0 ? (
        <Notice>Esta rutina todavía no tiene semanas.</Notice>
      ) : (
        <div className="space-y-3">
          {microcycles.map((microcycle, i) => (
            <MicrocycleSection
              key={microcycle.id}
              splitId={splitId}
              microcycle={microcycle}
              index={i}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAddMicroOpen(true)}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-edge py-4 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-primary hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Agregar semana
      </button>

      <SplitFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        split={split}
      />
      <MicrocycleFormDialog
        open={addMicroOpen}
        onOpenChange={setAddMicroOpen}
        splitId={splitId}
        defaultOrder={nextOrder}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Borrar rutina?"
        description={`Se va a borrar "${split.name}" y todo su contenido.`}
        onConfirm={onConfirmDelete}
        isPending={deleteSplit.isPending}
      />
    </div>
  )
}

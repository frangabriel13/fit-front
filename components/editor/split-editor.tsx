"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { useSplit, useDeleteSplit } from "@/hooks/use-splits"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MicrocycleSection } from "@/components/editor/microcycle-section"
import { MicrocycleFormDialog } from "@/components/editor/microcycle-form-dialog"
import { SplitFormDialog } from "@/components/splits/split-form-dialog"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"

export function SplitEditor({ splitId }: { splitId: string }) {
  const router = useRouter()
  const { data: split, isLoading, isError, refetch } = useSplit(splitId)
  const deleteSplit = useDeleteSplit()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addMicroOpen, setAddMicroOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError || !split) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el split.
        </p>
        <Button variant="outline" className="mt-3" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const microcycles = [...(split.microcycles ?? [])].sort(
    (a, b) => a.order - b.order
  )
  const nextOrder =
    microcycles.length > 0
      ? Math.max(...microcycles.map((m) => m.order)) + 1
      : 0

  function onConfirmDelete() {
    deleteSplit.mutate(splitId, {
      onSuccess: () => {
        toast.success("Split borrado")
        router.replace("/")
      },
      onError: () => toast.error("No se pudo borrar el split."),
    })
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{split.name}</h1>
          {split.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {split.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            aria-label="Editar split"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            aria-label="Borrar split"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {microcycles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Este split no tiene microciclos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {microcycles.map((microcycle) => (
            <MicrocycleSection
              key={microcycle.id}
              splitId={splitId}
              microcycle={microcycle}
            />
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setAddMicroOpen(true)}
      >
        <Plus className="size-4" />
        Agregar microciclo
      </Button>

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
        title="¿Borrar split?"
        description={`Se va a borrar "${split.name}" y todo su contenido.`}
        onConfirm={onConfirmDelete}
        isPending={deleteSplit.isPending}
      />
    </div>
  )
}

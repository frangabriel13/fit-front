"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreVertical, Pencil, Trash2, Layers } from "lucide-react"
import { toast } from "sonner"

import type { Split } from "@/types/api"
import { useDeleteSplit } from "@/hooks/use-splits"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SplitFormDialog } from "@/components/splits/split-form-dialog"
import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"

export function SplitCard({ split }: { split: Split }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteSplit = useDeleteSplit()

  function onConfirmDelete() {
    deleteSplit.mutate(split.id, {
      onSuccess: () => {
        toast.success("Rutina borrada")
        setDeleteOpen(false)
      },
      onError: () => toast.error("No se pudo borrar la rutina."),
    })
  }

  const microcycleCount = split.microcycles?.length ?? 0

  return (
    <>
      <Card className="relative transition-colors hover:border-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="truncate">
                <Link href={`/splits/${split.id}`} className="hover:underline">
                  {split.name}
                </Link>
              </CardTitle>
              {split.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {split.description}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-1 shrink-0"
                  aria-label="Acciones"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="size-4" />
            {microcycleCount}{" "}
            {microcycleCount === 1 ? "microciclo" : "microciclos"}
          </div>
        </CardHeader>
      </Card>

      <SplitFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        split={split}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Borrar rutina?"
        description={`Se va a borrar "${split.name}" y todo su contenido. Esta acción no se puede deshacer.`}
        onConfirm={onConfirmDelete}
        isPending={deleteSplit.isPending}
      />
    </>
  )
}

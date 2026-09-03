"use client"

import { useState } from "react"
import Link from "next/link"
import { Layers, MoreVertical, Pencil, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"

import { DeleteConfirmDialog } from "@/components/splits/delete-confirm-dialog"
import { SplitFormDialog } from "@/components/splits/split-form-dialog"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDeleteSplit } from "@/hooks/use-splits"
import { cn } from "@/lib/utils"
import type { Split } from "@/types/api"

export function SplitCard({ split, index = 0 }: { split: Split; index?: number }) {
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
  // El invariante de la API es que un CLIENTE tiene una sola rutina; al revés
  // no: la misma rutina puede servir de plantilla para varios.
  const asignados = split.clients ?? []
  const aQuien =
    asignados.length === 0
      ? "Sin asignar"
      : asignados.length <= 2
        ? asignados.map((c) => c.name).join(", ")
        : `${asignados[0].name} +${asignados.length - 1}`

  return (
    <>
      <div
        style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
        className="fade-up rounded-2xl border border-hairline bg-surface p-5 transition-colors hover:border-edge"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl leading-none uppercase">
              <Link
                href={`/splits/${split.id}`}
                className="transition-colors hover:text-primary"
              >
                {split.name}
              </Link>
            </h2>
            {split.description && (
              <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                {split.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-1 -mr-2 shrink-0 text-muted-foreground"
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

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Eyebrow
            as="p"
            tone="meta"
            className="flex items-center gap-1.5 text-faint"
          >
            <Layers className="size-3.5" />
            {microcycleCount} {microcycleCount === 1 ? "semana" : "semanas"}
          </Eyebrow>
          {/* Sin esto todas las rutinas se ven iguales y no hay forma de saber
              de quién es cuál. */}
          <Eyebrow
            as="p"
            tone="meta"
            className={cn(
              "flex min-w-0 items-center gap-1.5",
              asignados.length > 0 ? "text-primary" : "text-faint"
            )}
          >
            <UserRound className="size-3.5 shrink-0" />
            <span className="truncate">{aQuien}</span>
          </Eyebrow>
        </div>
      </div>

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

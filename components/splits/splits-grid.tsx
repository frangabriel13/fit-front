"use client"

import { useState } from "react"
import { Plus, Dumbbell } from "lucide-react"

import { useSplits } from "@/hooks/use-splits"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SplitCard } from "@/components/splits/split-card"
import { SplitFormDialog } from "@/components/splits/split-form-dialog"

export function SplitsGrid() {
  const { data: splits, isLoading, isError, refetch } = useSplits()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mis rutinas</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nuevo split
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar tus rutinas.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {splits && splits.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Dumbbell className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Todavía no tenés rutinas</p>
          <p className="text-sm text-muted-foreground">
            Creá tu primer split para empezar.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo split
          </Button>
        </div>
      )}

      {splits && splits.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {splits.map((split) => (
            <SplitCard key={split.id} split={split} />
          ))}
        </div>
      )}

      <SplitFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

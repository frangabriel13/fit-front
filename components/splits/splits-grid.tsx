"use client"

import { useState } from "react"
import { Dumbbell, Plus } from "lucide-react"

import { Notice } from "@/components/feedback/notice"
import { SplitCard } from "@/components/splits/split-card"
import { SplitFormDialog } from "@/components/splits/split-form-dialog"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-auth"
import { useSplits } from "@/hooks/use-splits"

/**
 * El editor de rutinas del entrenador.
 *
 * Crear es solo para `trainer` (la API responde 403 a un cliente), así que el
 * botón no se muestra: ofrecer una acción que ya sabemos que va a fallar es
 * peor que no ofrecerla.
 */
export function SplitsGrid() {
  const { data: splits, isLoading, isError, refetch } = useSplits()
  const { data: me } = useMe()
  const isTrainer = me?.role === "trainer"
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div>
      <div className="fade-up mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Eyebrow as="p" className="font-semibold text-primary">
            {isTrainer ? "Entrenador" : "Asignadas"}
          </Eyebrow>
          <h1 className="mt-1.5 font-display text-4xl leading-none uppercase lg:text-5xl">
            Mis rutinas
          </h1>
        </div>
        {isTrainer && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase"
          >
            <Plus className="size-3.5" />
            Nueva rutina
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <Notice>
          <p>No se pudieron cargar tus rutinas.</p>
          <Button
            variant="outline"
            className="mt-3 h-9 px-4 text-[10px] tracking-[0.16em] uppercase"
            onClick={() => refetch()}
          >
            Reintentar
          </Button>
        </Notice>
      )}

      {splits && splits.length === 0 && (
        <Notice>
          <Dumbbell className="mx-auto size-7 text-faint" />
          <p className="mt-3 font-display text-lg uppercase text-foreground">
            Todavía no tenés rutinas
          </p>
          <p className="mt-1">
            {isTrainer
              ? "Creá tu primera rutina para empezar."
              : "Tu entrenador todavía no te asignó ninguna."}
          </p>
          {isTrainer && (
            <Button
              className="mt-4 h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              Nueva rutina
            </Button>
          )}
        </Notice>
      )}

      {splits && splits.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {splits.map((split, i) => (
            <SplitCard key={split.id} split={split} index={i} />
          ))}
        </div>
      )}

      <SplitFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

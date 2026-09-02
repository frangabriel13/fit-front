"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Pencil } from "lucide-react"

import { AssignSplitDialog } from "@/components/clients/assign-split-dialog"
import { Notice } from "@/components/feedback/notice"
import { ProgressList } from "@/components/progress/progress-list"
import { RoutineView } from "@/components/routine/routine-view"
import { WeekBar } from "@/components/routine/week-bar"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-auth"
import { useClients } from "@/hooks/use-clients"
import { usePlan } from "@/hooks/use-plan"
import { cn } from "@/lib/utils"

type Tab = "rutina" | "progreso"

function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/**
 * La ficha de un cliente para su entrenador: su rutina y su progreso, en solo
 * lectura.
 *
 * Todo el alcance lo resuelve el backend a partir del id — `usePlan(clientId)`
 * manda el filtro y la API verifica que el cliente sea de esta cartera. Acá no
 * se decide ningún permiso, solo se pide con nombre y apellido de quién.
 */
export function ClientDetail({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState<Tab>("rutina")
  const [assignOpen, setAssignOpen] = useState(false)

  const { data: me, isPending: loadingMe } = useMe()
  const isTrainer = me?.role === "trainer"
  const { data: clients, isPending: loadingClients } = useClients(isTrainer)

  const { split, days, history, week, totalWeeks, isPending, isError, isEmpty } =
    usePlan(clientId)

  if (loadingMe || loadingClients) return <Loading />

  if (!isTrainer)
    return (
      <Notice>
        Esta sección es solo para entrenadores.{" "}
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </Notice>
    )

  const client = clients?.find((c) => c.id === clientId)
  if (!client)
    return (
      <Notice>
        Este cliente no está en tu cartera.{" "}
        <Link
          href="/clientes"
          className="text-primary underline-offset-4 hover:underline"
        >
          Ver mis clientes
        </Link>
      </Notice>
    )

  const exercises = Object.values(history)

  return (
    <>
      <Link
        href="/clientes"
        className="fade-up mb-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Mis clientes
      </Link>

      <div className="fade-up mb-6 flex flex-col gap-4 [--delay:60ms] sm:flex-row sm:items-end sm:justify-between sm:gap-x-6">
        <div className="min-w-0">
          <Eyebrow as="p" className="font-semibold text-primary">
            Cliente
          </Eyebrow>
          <h1 className="mt-1.5 truncate font-display text-4xl leading-none uppercase lg:text-5xl">
            {client.name}
          </h1>
          <p className="mt-2 truncate font-mono text-[12px] text-faint">
            {client.email}
          </p>
        </div>

        {!isEmpty && totalWeeks > 0 && (
          <div className="flex items-center gap-4 border-t border-white/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
            <div className="text-left sm:text-right">
              <Eyebrow as="p" className="text-muted-foreground/80">
                Semana en curso
              </Eyebrow>
              <p className="mt-0.5 font-mono text-[13px] leading-none tracking-[0.1em] text-foreground uppercase">
                Sem {String(week).padStart(2, "0")}
                <span className="text-muted-foreground/60"> / {totalWeeks}</span>
              </p>
            </div>
            <WeekBar week={week} totalWeeks={totalWeeks} className="w-24" />
          </div>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Vista del cliente"
        className="fade-up mb-6 flex gap-1.5 [--delay:80ms]"
      >
        {(
          [
            ["rutina", "Rutina"],
            ["progreso", "Progreso"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase transition-colors",
              tab === value
                ? "bg-primary text-primary-foreground"
                : "border border-hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isPending ? (
        <Loading />
      ) : isError ? (
        <Notice>No se pudo cargar la rutina de {client.name}.</Notice>
      ) : isEmpty ? (
        <Notice>
          <p>{client.name} todavía no tiene una rutina asignada.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Button
              onClick={() => setAssignOpen(true)}
              className="h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase"
            >
              Asignar una rutina
            </Button>
            <Link
              href="/splits"
              className="text-primary underline-offset-4 hover:underline"
            >
              o armar una nueva
            </Link>
          </div>
        </Notice>
      ) : days.length === 0 ? (
        // Distinto de no tener rutina, y hay que decirlo distinto: mandar a
        // asignar una que ya está asignada es mandar al lugar equivocado.
        <Notice>
          La rutina de {client.name} todavía no tiene días cargados.{" "}
          {split && (
            <Link
              href={`/splits/${split.id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Editar {split.name}
            </Link>
          )}
        </Notice>
      ) : tab === "rutina" ? (
        <>
          {split && (
            <div className="mb-4 flex items-center justify-between gap-3">
              <Eyebrow as="p" className="min-w-0 truncate text-muted-foreground">
                {split.name}
              </Eyebrow>
              <Link
                href={`/splits/${split.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:border-edge hover:text-foreground"
              >
                <Pencil className="size-3" />
                Editar
              </Link>
            </div>
          )}
          <RoutineView
            days={days}
            history={history}
            week={week}
            totalWeeks={totalWeeks}
            userId={clientId}
            readOnly
          />
        </>
      ) : exercises.length === 0 ? (
        <Notice>
          {client.name} todavía no cerró ninguna semana. La progresión aparece
          cuando complete series.
        </Notice>
      ) : (
        <ProgressList
          exercises={exercises}
          week={week}
          totalWeeks={totalWeeks}
        />
      )}

      <AssignSplitDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        clientId={clientId}
        clientName={client.name}
      />
    </>
  )
}

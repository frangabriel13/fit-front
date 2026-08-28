"use client"

import Link from "next/link"

import { Notice } from "@/components/feedback/notice"
import { ProgressList } from "@/components/progress/progress-list"
import { WeekBar } from "@/components/routine/week-bar"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlan } from "@/hooks/use-plan"

function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

/** El progreso del macrociclo de quien está logueado, ejercicio por ejercicio. */
export function ProgressScreen() {
  const { split, history, week, totalWeeks, isPending, isError, isEmpty } =
    usePlan()

  if (isPending) return <Loading />
  if (isError) return <Notice>No se pudo cargar tu progreso.</Notice>
  if (isEmpty || !split)
    return <Notice>Todavía no tenés una rutina asignada.</Notice>

  const exercises = Object.values(history)

  return (
    <>
      <div className="fade-up mb-7 flex flex-col gap-4 [--delay:60ms] sm:flex-row sm:items-end sm:justify-between sm:gap-x-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
            Mi progreso
          </p>
          <h1 className="mt-1.5 font-display text-4xl leading-none uppercase lg:text-5xl">
            {split.name}
          </h1>
        </div>

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
      </div>

      {exercises.length === 0 ? (
        <Notice>
          Todavía no hay series registradas en este macrociclo. Entrená un día y
          la progresión aparece acá.{" "}
          <Link
            href="/rutina"
            className="text-primary underline-offset-4 hover:underline"
          >
            Ir a mi rutina
          </Link>
        </Notice>
      ) : (
        <ProgressList exercises={exercises} week={week} totalWeeks={totalWeeks} />
      )}
    </>
  )
}

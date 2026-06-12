import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AppHeader } from "@/components/layout/app-header"
import { RoutineView } from "@/components/routine/routine-view"
import { MACROCYCLE, ROUTINE } from "@/lib/routine-data"

export const metadata: Metadata = {
  title: "Mi rutina · FitFront",
}

export default function RutinaPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Inicio
        </Link>

        <div className="relative mt-5 mb-8 flex items-end justify-between gap-4">
          {/* Fuente de luz detrás del título */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -left-24 size-72 rounded-full bg-primary/[0.08] blur-3xl"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Mi rutina
            </p>
            <h1 className="mt-1 font-display text-4xl leading-none uppercase lg:text-5xl">
              {ROUTINE.name}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {ROUTINE.days.length} días · semana{" "}
              <span className="text-foreground">
                {String(MACROCYCLE.week).padStart(2, "0")}
              </span>{" "}
              / {String(MACROCYCLE.totalWeeks).padStart(2, "0")}
            </p>
            <div
              role="progressbar"
              aria-label="Progreso del macrociclo"
              aria-valuemin={1}
              aria-valuemax={MACROCYCLE.totalWeeks}
              aria-valuenow={MACROCYCLE.week}
              className="mt-2.5 ml-auto h-1 w-44 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_8px] shadow-primary/60"
                style={{
                  width: `${(MACROCYCLE.week / MACROCYCLE.totalWeeks) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <RoutineView />
      </main>
    </>
  )
}

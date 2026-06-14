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
          className="inline-flex items-center gap-2 font-label text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Inicio
        </Link>

        <div className="fade-up mt-5 mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 [--delay:60ms]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
              Mi rutina
            </p>
            <h1 className="mt-1.5 font-display text-4xl leading-none uppercase lg:text-5xl">
              {ROUTINE.name}
            </h1>
          </div>

          {/* Posición en el macrociclo: compacto, en línea con el título */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/80 uppercase">
                Macrociclo · {ROUTINE.days.length} días
              </p>
              <p className="mt-0.5 font-mono text-[13px] leading-none tracking-[0.1em] text-foreground uppercase">
                Sem {String(MACROCYCLE.week).padStart(2, "0")}
                <span className="text-muted-foreground/60">
                  {" "}
                  / {MACROCYCLE.totalWeeks}
                </span>
              </p>
            </div>
            <div
              className="flex w-24 gap-1"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={MACROCYCLE.totalWeeks}
              aria-valuenow={MACROCYCLE.week}
              aria-label={`Semana ${MACROCYCLE.week} de ${MACROCYCLE.totalWeeks}`}
            >
              {Array.from({ length: MACROCYCLE.totalWeeks }, (_, i) => {
                const week = i + 1
                const current = week === MACROCYCLE.week
                const past = week < MACROCYCLE.week
                return (
                  <span
                    key={i}
                    className={cn(
                      "h-6 flex-1 rounded-full transition-colors",
                      current &&
                        "bg-primary shadow-[0_0_12px_-2px] shadow-primary/60",
                      past && "bg-primary/45",
                      !current && !past && "bg-white/8"
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <RoutineView />
      </main>
    </>
  )
}

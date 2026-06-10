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

        <div className="mt-5 mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
              Mi rutina
            </p>
            <h1 className="mt-1 font-display text-4xl leading-none uppercase lg:text-5xl">
              {ROUTINE.name}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] tracking-wider text-muted-foreground uppercase">
              {ROUTINE.days.length} días · Semana {MACROCYCLE.week} de{" "}
              {MACROCYCLE.totalWeeks}
            </span>
            <div className="mt-2.5 ml-auto flex w-28 gap-1">
              {Array.from({ length: MACROCYCLE.totalWeeks }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < MACROCYCLE.week
                      ? "h-1 flex-1 rounded-full bg-primary"
                      : "h-1 flex-1 rounded-full bg-white/10"
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <RoutineView />
      </main>
    </>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AppHeader } from "@/components/layout/app-header"
import { RoutineView } from "@/components/routine/routine-view"
import { MACROCYCLE, ROUTINE } from "@/lib/routine-data"
import { cn } from "@/lib/utils"

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
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
              {ROUTINE.days.length} días · macrociclo {MACROCYCLE.totalWeeks}{" "}
              sem.
            </p>
            <div className="mt-2 flex items-baseline justify-end gap-2.5 font-mono text-[13px] leading-none">
              {Array.from({ length: MACROCYCLE.totalWeeks }, (_, i) => {
                const week = i + 1
                const current = week === MACROCYCLE.week
                const past = week < MACROCYCLE.week
                return (
                  <span
                    key={i}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "pb-1",
                      current &&
                        "text-primary underline decoration-primary decoration-2 underline-offset-4",
                      past && "text-foreground/80",
                      !current && !past && "text-muted-foreground/35"
                    )}
                  >
                    {String(week).padStart(2, "0")}
                  </span>
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

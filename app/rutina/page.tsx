import type { Metadata } from "next"

import { Eyebrow } from "@/components/typography/eyebrow"
import { AppHeader } from "@/components/layout/app-header"
import { RoutineView } from "@/components/routine/routine-view"
import { MACROCYCLE, ROUTINE } from "@/lib/routine-data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Mi rutina · FitFront",
}

// Barra segmentada de semanas del macrociclo. El ancho lo define `className`
// (compacto en desktop, full-width en móvil).
function WeekBar({
  className,
  segmentClassName = "h-6",
}: {
  className?: string
  segmentClassName?: string
}) {
  return (
    <div
      className={cn("flex gap-1", className)}
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
              "flex-1 rounded-full transition-colors",
              segmentClassName,
              current && "bg-primary shadow-[0_0_12px_-2px] shadow-primary/60",
              past && "bg-primary/45",
              !current && !past && "bg-white/8"
            )}
          />
        )
      })}
    </div>
  )
}

export default function RutinaPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-32 md:pt-8 md:pb-10 lg:px-6 lg:pt-10">
        <div className="fade-up mb-7 flex flex-col gap-4 [--delay:60ms] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6 sm:gap-y-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
              Mi rutina
            </p>
            <h1 className="mt-1.5 font-display text-4xl leading-none uppercase lg:text-5xl">
              {ROUTINE.name}
            </h1>
          </div>

          {/* Macrociclo — compacto, en línea con el título (desktop) */}
          <div className="hidden items-center gap-4 border-l border-white/10 pl-6 sm:flex">
            <div className="text-right">
              <Eyebrow as="p" className="text-muted-foreground/80">
                Macrociclo · {ROUTINE.days.length} días
              </Eyebrow>
              <p className="mt-0.5 font-mono text-[13px] leading-none tracking-[0.1em] text-foreground uppercase">
                Sem {String(MACROCYCLE.week).padStart(2, "0")}
                <span className="text-muted-foreground/60">
                  {" "}
                  / {MACROCYCLE.totalWeeks}
                </span>
              </p>
            </div>
            <WeekBar className="w-24" />
          </div>

          {/* Macrociclo — barra full-width (móvil) */}
          <div className="border-t border-white/10 pt-4 sm:hidden">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <Eyebrow as="p" className="text-muted-foreground/80">
                Macrociclo · {ROUTINE.days.length} días
              </Eyebrow>
              <p className="font-mono text-[12px] leading-none tracking-[0.1em] text-foreground uppercase">
                Sem {String(MACROCYCLE.week).padStart(2, "0")}
                <span className="text-muted-foreground/60">
                  {" "}
                  / {MACROCYCLE.totalWeeks}
                </span>
              </p>
            </div>
            <WeekBar className="w-full" segmentClassName="h-2" />
          </div>
        </div>

        <RoutineView />
      </main>
    </>
  )
}

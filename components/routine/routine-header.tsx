import { Eyebrow } from "@/components/typography/eyebrow"
import { WeekBar } from "@/components/routine/week-bar"

/** Título de la rutina + posición en el macrociclo. */
export function RoutineHeader({
  name,
  dayCount,
  week,
  totalWeeks,
}: {
  name: string
  dayCount: number
  week: number
  totalWeeks: number
}) {
  const label = (
    <Eyebrow as="p" className="text-muted-foreground/80">
      Macrociclo · {dayCount} días
    </Eyebrow>
  )
  const counter = (size: string) => (
    <p
      className={`font-mono ${size} leading-none tracking-[0.1em] text-foreground uppercase`}
    >
      Sem {String(week).padStart(2, "0")}
      <span className="text-muted-foreground/60"> / {totalWeeks}</span>
    </p>
  )

  return (
    <div className="fade-up mb-7 flex flex-col gap-4 [--delay:60ms] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6 sm:gap-y-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
          Mi rutina
        </p>
        <h1 className="mt-1.5 font-display text-4xl leading-none uppercase lg:text-5xl">
          {name}
        </h1>
      </div>

      {/* Macrociclo — compacto, en línea con el título (desktop) */}
      <div className="hidden items-center gap-4 border-l border-white/10 pl-6 sm:flex">
        <div className="text-right">
          {label}
          <div className="mt-0.5">{counter("text-[13px]")}</div>
        </div>
        <WeekBar week={week} totalWeeks={totalWeeks} className="w-24" />
      </div>

      {/* Macrociclo — barra full-width (móvil) */}
      <div className="border-t border-white/10 pt-4 sm:hidden">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          {label}
          {counter("text-[12px]")}
        </div>
        <WeekBar
          week={week}
          totalWeeks={totalWeeks}
          className="w-full"
          segmentClassName="h-2"
        />
      </div>
    </div>
  )
}

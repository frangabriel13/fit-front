import { cn } from "@/lib/utils"

/**
 * Barra segmentada de semanas del macrociclo. El ancho lo define `className`
 * (compacto en desktop, full-width en móvil).
 */
export function WeekBar({
  week,
  totalWeeks,
  className,
  segmentClassName = "h-6",
}: {
  week: number
  totalWeeks: number
  className?: string
  segmentClassName?: string
}) {
  return (
    <div
      className={cn("flex gap-1", className)}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalWeeks}
      aria-valuenow={week}
      aria-label={`Semana ${week} de ${totalWeeks}`}
    >
      {Array.from({ length: totalWeeks }, (_, i) => {
        const n = i + 1
        const current = n === week
        const past = n < week
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

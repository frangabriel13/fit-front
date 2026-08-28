import { ProgressionRail } from "@/components/routine/progression-rail"
import type { ExerciseHistory } from "@/types/api"

/**
 * Un gráfico de progresión por ejercicio.
 *
 * Solo llegan acá los ejercicios con al menos una semana cerrada: el historial
 * lo arma la API a partir de las series completadas, así que una rutina recién
 * empezada no tiene nada que mostrar todavía.
 */
export function ProgressList({
  exercises,
  week,
  totalWeeks,
}: {
  exercises: ExerciseHistory[]
  week: number
  totalWeeks: number
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {exercises.map((ex, i) => (
        <li
          key={ex.name}
          style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}
          className="fade-up rounded-2xl border border-hairline bg-surface p-5"
        >
          <h2 className="mb-4 truncate font-display text-lg leading-none uppercase">
            {ex.name}
          </h2>
          <ProgressionRail history={ex} week={week} totalWeeks={totalWeeks} />
        </li>
      ))}
    </ul>
  )
}

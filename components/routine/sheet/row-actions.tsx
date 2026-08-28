import Link from "next/link"
import { Play } from "lucide-react"

import type { ExerciseState } from "@/lib/training-math"
import { cn } from "@/lib/utils"

/** Atajo para entrenar el ejercicio, sin abrir el detalle. */
export function RowActions({
  name,
  href,
  state,
  className,
}: {
  name: string
  href: string
  state: ExerciseState
  className?: string
}) {
  return (
    <span className={cn("flex items-center justify-end", className)}>
      <Link
        href={href}
        aria-label={`Entrenar ${name}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border transition-colors md:size-9",
          state === "in-progress"
            ? "border-ember/50 text-ember hover:bg-ember hover:text-background"
            : "border-white/12 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        )}
      >
        <Play className="size-3.5 fill-current" />
      </Link>
    </span>
  )
}

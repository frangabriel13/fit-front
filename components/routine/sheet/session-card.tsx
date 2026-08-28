import Link from "next/link"
import { Play } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import type { PlanDay } from "@/lib/plan"
import { trainHref } from "@/lib/routes"

/** Tarjeta de sesión (md+): estado del día y el botón para entrar a entrenar. */
export function SessionCard({
  day,
  hasSession,
  startedAt,
  doneCount,
  readOnly = false,
}: {
  day: PlanDay
  hasSession: boolean
  startedAt: string | null
  doneCount: number
  readOnly?: boolean
}) {
  return (
    <div className="fade-up mt-5 hidden flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-2xl border border-white/10 bg-card/40 px-5 py-4 md:flex">
      <div className="min-w-0">
        {hasSession ? (
          <>
            <Eyebrow as="p" size="lg" className="flex items-center gap-2">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-ember" />
              <span className="text-ember">En curso</span>
              {startedAt && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground">
                    empezado {startedAt}
                  </span>
                </>
              )}
            </Eyebrow>
            <p className="mt-1.5 text-sm text-foreground">
              <span className="font-display text-lg text-primary">{doneCount}</span>
              <span className="text-muted-foreground">
                {" "}
                de {day.exercises.length} ejercicios completados
              </span>
            </p>
          </>
        ) : (
          <>
            <Eyebrow as="p" size="lg" className="text-muted-foreground">
              Sin empezar
            </Eyebrow>
            <p className="mt-1.5 text-sm text-muted-foreground">
              <span className="text-foreground">
                {day.exercises.length} ejercicios
              </span>
              {day.focus && ` · ${day.focus}`}
            </p>
          </>
        )}
      </div>
      {!readOnly && (
        <Button
          asChild
          className="h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase shadow-[0_8px_30px_-10px] shadow-primary/50 transition-shadow hover:shadow-primary/70"
        >
          <Link href={trainHref(day.id)}>
            <Play className="size-3.5 fill-current" />
            {hasSession ? "Reanudar" : "Comenzar"}
          </Link>
        </Button>
      )}
    </div>
  )
}

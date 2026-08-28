import Link from "next/link"
import { Play } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import type { PlanDay } from "@/lib/plan"
import { trainHref } from "@/lib/routes"

/** CTA de sesión fijo al pulgar (solo móvil). */
export function SessionCta({
  day,
  hasSession,
  doneCount,
}: {
  day: PlanDay
  hasSession: boolean
  doneCount: number
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)]">
        <div className="min-w-0">
          <Eyebrow as="p" className="truncate text-muted-foreground/70">
            Día {String(day.order).padStart(2, "0")} · {day.name}
          </Eyebrow>
          <p className="mt-0.5 truncate text-[13px]">
            {hasSession ? (
              <span className="flex items-center gap-1.5 text-ember">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-ember" />
                En curso · {doneCount}/{day.exercises.length}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {day.exercises.length} ejercicios
                {day.focus && ` · ${day.focus}`}
              </span>
            )}
          </p>
        </div>
        <Button
          asChild
          className="h-12 shrink-0 px-6 text-[12px] font-semibold tracking-[0.16em] uppercase shadow-[0_8px_30px_-10px] shadow-primary/50"
        >
          <Link href={trainHref(day.id)}>
            <Play className="size-4 fill-current" />
            {hasSession ? "Reanudar" : "Comenzar"}
          </Link>
        </Button>
      </div>
    </div>
  )
}

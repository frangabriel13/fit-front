"use client"

import type { PlanDay } from "@/lib/plan"
import { cn } from "@/lib/utils"

/** Tabs tipográficos de día, con scroll horizontal en mobile. */
export function DayTabs({
  days,
  active,
  onSelect,
}: {
  days: PlanDay[]
  active: number
  onSelect: (i: number) => void
}) {
  return (
    <nav className="-mx-4 flex gap-6 overflow-x-auto border-b border-white/10 px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      {days.map((d, i) => (
        <button
          key={d.id}
          onClick={() => onSelect(i)}
          className="relative shrink-0 cursor-pointer pb-3 text-left outline-none"
        >
          <span
            className={cn(
              "mr-2 font-mono text-[10px]",
              i === active ? "text-primary" : "text-muted-foreground/60"
            )}
          >
            {String(d.order).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "font-display text-xl tracking-wide uppercase transition-colors",
              i === active
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            {d.name}
          </span>
          {i === active && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </nav>
  )
}

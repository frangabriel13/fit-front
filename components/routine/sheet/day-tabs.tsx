"use client"

import { ROUTINE } from "@/lib/routine-data"
import { cn } from "@/lib/utils"

/** Tabs tipográficos de día, con scroll horizontal en mobile. */
export function DayTabs({
  active,
  onSelect,
}: {
  active: number
  onSelect: (i: number) => void
}) {
  return (
    <nav className="-mx-4 flex gap-6 overflow-x-auto border-b border-white/10 px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      {ROUTINE.days.map((d, i) => (
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
            {d.placeholder && <sup className="ml-0.5 text-primary/70">*</sup>}
          </span>
          {i === active && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </nav>
  )
}

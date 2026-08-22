import { Eyebrow } from "@/components/typography/eyebrow"
import { sheet, type SheetItem } from "@/lib/sheet"
import { cn } from "@/lib/utils"

/**
 * Identidad del ejercicio. Sin dial de avance: el título se queda con el ancho
 * completo (Anton grande, que es lo que se lee de reojo) y el avance ya lo
 * cuenta la matriz de series de más abajo.
 */
export function ExerciseHeader({
  slotNum,
  members,
  activeIndex,
  rounds,
}: {
  slotNum: string
  members: SheetItem[]
  activeIndex: number
  rounds: number
}) {
  const isSuper = members.length > 1
  const ex = members[activeIndex].ex

  return (
    <div className="fade-up pb-3.5 [--delay:40ms]">
      <Eyebrow as="p" className="font-semibold tracking-[0.26em] text-primary">
        Ejercicio {slotNum}
        {isSuper && ` · ${members.length === 2 ? "biserie" : "superserie"}`}
      </Eyebrow>

      {isSuper ? (
        <div className="mt-2 space-y-0.5">
          {members.map((it, mi) => {
            const isActive = mi === activeIndex
            return (
              <h1
                key={it.ex.name}
                className={cn(
                  "font-display text-[clamp(19px,6.2cqi,25px)] leading-[1.05] uppercase",
                  isActive ? "text-foreground" : "text-faint"
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 text-[0.7em]",
                    isActive ? "text-primary" : "text-faint"
                  )}
                >
                  {it.letter}
                </span>
                {it.ex.name}
              </h1>
            )
          })}
        </div>
      ) : (
        <h1 className="mt-2 font-display text-[clamp(26px,9.4cqi,38px)] leading-[0.95] uppercase">
          {ex.name}
        </h1>
      )}

      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        {rounds} {isSuper ? "vueltas" : "×"} {sheet(ex.reps)} · RIR{" "}
        {sheet(ex.effort)} · desc {sheet(ex.rest)}
      </p>
    </div>
  )
}

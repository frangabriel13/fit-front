import { cn } from "@/lib/utils"
import { COLS } from "./columns"

/** Encabezado de columnas de la planilla (solo md+). */
export function SheetHeader() {
  return (
    <div
      className={cn(
        "mt-6 hidden px-4 pb-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/80 uppercase",
        COLS
      )}
    >
      <span>Nº</span>
      <span>Ejercicio</span>
      <span className="text-center">Series</span>
      <span className="text-center">Reps</span>
      <span className="text-center">RIR</span>
      <span className="text-center">Desc.</span>
      <span />
    </div>
  )
}

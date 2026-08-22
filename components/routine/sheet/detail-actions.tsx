import Link from "next/link"
import { Play, RotateCcw, X } from "lucide-react"

/** Acciones del detalle: primaria + secundarias, con la destructiva apartada. */
export function DetailActions() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <Link
        href="/rutina/entrenar"
        className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-[0_8px_24px_-12px] shadow-primary/60 transition-colors hover:bg-primary/90 md:inline-flex"
      >
        <Play className="size-3 fill-current" />
        Entrenar
      </Link>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:bg-secondary hover:text-foreground md:py-2"
      >
        <RotateCcw className="size-3" />
        Reiniciar
      </button>
      <button
        type="button"
        className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground/70 uppercase transition-colors hover:bg-destructive/10 hover:text-destructive md:py-2"
      >
        <X className="size-3" />
        No realizado
      </button>
    </div>
  )
}

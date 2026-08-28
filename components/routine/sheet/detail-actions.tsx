import Link from "next/link"
import { Play } from "lucide-react"

/** Acción del detalle: entrar a entrenar este ejercicio. */
export function DetailActions({ href }: { href: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <Link
        href={href}
        className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-[0_8px_24px_-12px] shadow-primary/60 transition-colors hover:bg-primary/90 md:inline-flex"
      >
        <Play className="size-3 fill-current" />
        Entrenar
      </Link>
    </div>
  )
}

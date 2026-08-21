import { ChevronRight } from "lucide-react"
import { type CSSProperties, type ReactNode } from "react"

/** Encabezado plegable: <details> nativo con chevron que rota al abrir. */
export function Disclosure({
  eyebrow,
  meta,
  children,
  delay,
}: {
  eyebrow: string
  meta?: ReactNode
  children: ReactNode
  delay: string
}) {
  return (
    <details
      className="group fade-up border-t border-hairline"
      style={{ "--delay": delay } as CSSProperties}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {eyebrow}
          </span>
          {meta}
        </span>
        <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  )
}

// ─── pantalla ──────────────────────────────────────────────────────────────────

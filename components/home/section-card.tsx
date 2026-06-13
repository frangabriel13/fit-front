import Image from "next/image"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Paletas de acento por card (cyan de marca / ember ámbar). */
const ACCENTS = {
  primary: {
    text: "text-primary",
    badgeRing: "ring-primary/30",
    badgeHover:
      "group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary",
    numberHover: "group-hover:text-primary/40",
    tint: "bg-primary/15",
  },
  ember: {
    text: "text-ember",
    badgeRing: "ring-ember/30",
    badgeHover:
      "group-hover:bg-ember group-hover:text-background group-hover:ring-ember",
    numberHover: "group-hover:text-ember/40",
    tint: "bg-ember/15",
  },
} as const

interface SectionCardProps {
  href: string
  eyebrow: string
  title: string
  cta: string
  icon: LucideIcon
  image: string
  imageAlt: string
  /** Punto focal de la foto (clase object-position de Tailwind). */
  imagePosition?: string
  index: string
  /** Acento de color de la card. */
  accent?: keyof typeof ACCENTS
  className?: string
  /** Delay de la animación de entrada, ej. "120ms". */
  delay?: string
}

export function SectionCard({
  href,
  eyebrow,
  title,
  cta,
  icon: Icon,
  image,
  imageAlt,
  imagePosition = "object-center",
  index,
  accent = "primary",
  className,
  delay = "0ms",
}: SectionCardProps) {
  const a = ACCENTS[accent]

  return (
    <Link
      href={href}
      style={{ "--delay": delay } as React.CSSProperties}
      className={cn(
        "group reveal-card relative flex min-h-[46vh] flex-1 flex-col justify-between overflow-hidden p-7 outline-none lg:min-h-0 lg:p-12",
        "focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset",
        className
      )}
    >
      {/* Foto de fondo: desaturada e integrada a la paleta; en hover recupera color y escala */}
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
        className={cn(
          "object-cover grayscale-[0.65] transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-[0.15]",
          imagePosition
        )}
      />

      {/* Velo: legibilidad del texto + fusión con el fondo de la app */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/25 transition-colors duration-700 group-hover:via-background/45"
      />
      {/* Tinte de marca sobre la foto (cyan o ember según la card) */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-60",
          a.tint
        )}
      />
      {/* Vignette lateral para que el texto respire */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent"
      />
      {/* Grano fílmico, como en el login */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%221%22/></svg>')]"
      />
      {/* Light sweep: un destello diagonal cruza la foto al entrar el cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
      />

      {/* Encabezado: badge + numeración editorial */}
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl bg-background/60 ring-1 backdrop-blur-md transition-colors duration-300",
            a.text,
            a.badgeRing,
            a.badgeHover
          )}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={cn(
            "font-display text-5xl leading-none text-foreground/15 transition-[color,transform] duration-500 ease-out group-hover:-translate-x-1 group-hover:-translate-y-0.5 lg:text-6xl",
            a.numberHover
          )}
        >
          {index}
        </span>
      </div>

      {/* Bloque de título + CTA */}
      <div className="relative">
        <p
          className={cn(
            "text-[11px] font-semibold tracking-[0.3em] uppercase",
            a.text
          )}
        >
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-5xl leading-[0.9] uppercase drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] lg:text-7xl">
          {title}
        </h2>
        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-foreground uppercase">
            {cta}
            <ArrowRight
              className={cn(
                "size-4 transition-transform duration-300 group-hover:translate-x-1.5",
                a.text
              )}
            />
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
        </div>
      </div>

      {/* Spotlight: esta card recede (se oscurece) cuando se hace hover en la hermana.
          Solo en desktop (lg); el hover propio la restaura. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 hidden bg-background opacity-0 transition-opacity duration-500 group-has-[a:hover]/home:opacity-50 group-hover:!opacity-0 lg:block"
      />
    </Link>
  )
}

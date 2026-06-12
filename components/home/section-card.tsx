import Image from "next/image"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

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
  /** Estado vivo de la sección (ej. sesión en curso): badge ámbar junto al ícono. */
  status?: string
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
  status,
  className,
  delay = "0ms",
}: SectionCardProps) {
  return (
    <Link
      href={href}
      style={{ "--delay": delay } as React.CSSProperties}
      className={cn(
        "group fade-up relative flex min-h-[46vh] flex-1 flex-col justify-between overflow-hidden p-7 outline-none lg:min-h-0 lg:p-12",
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
      {/* Tinte verde de marca sobre la foto */}
      <div
        aria-hidden
        className="absolute inset-0 bg-primary/15 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-60"
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

      {/* Encabezado: badge + estado vivo + numeración editorial */}
      <div className="relative flex items-start justify-between">
        <span className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-background/60 text-primary ring-1 ring-primary/30 backdrop-blur-md transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary">
            <Icon className="size-5" />
          </span>
          {status && (
            <span className="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-3 py-1.5 font-label text-[11px] font-medium tracking-[0.12em] text-ember uppercase backdrop-blur-md">
              <span className="size-1.5 animate-pulse rounded-full bg-ember" />
              {status}
            </span>
          )}
        </span>
        <span className="font-display text-5xl leading-none text-foreground/15 transition-colors duration-500 group-hover:text-primary/40 lg:text-6xl">
          {index}
        </span>
      </div>

      {/* Bloque de título + CTA */}
      <div className="relative">
        <p className="font-label text-xs font-medium tracking-[0.18em] text-primary uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-5xl leading-[0.9] uppercase drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] lg:text-7xl">
          {title}
        </h2>
        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 font-label text-sm font-medium tracking-[0.12em] text-foreground uppercase">
            {cta}
            <ArrowRight className="size-4 text-primary transition-transform duration-300 group-hover:translate-x-1.5" />
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
        </div>
      </div>
    </Link>
  )
}

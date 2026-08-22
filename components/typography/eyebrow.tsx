import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * El rótulo mono en mayúsculas que estructura toda la app.
 *
 * Existía copiado en 40 lugares con 29 combinaciones distintas de tamaño,
 * tracking y peso — o sea, no era un sistema. Acá quedan tres tamaños por tres
 * roles, y el rol define el tracking:
 *
 *   label   estructura: encabezados de sección, etiquetas de celda   (0.2em)
 *   action  botones y navegación                                     (0.14em)
 *   meta    dato al paso: unidades, contadores, texto secundario     (0.08em)
 *
 * Ni el COLOR ni el PESO son variantes: son decisiones del call site
 * (text-primary = "ahora", font-semibold = este rótulo pesa más que sus
 * vecinos), así que van por className y quedan a la vista donde se usan.
 * Un tracking distinto al del rol también se pide por className: es una
 * desviación deliberada y conviene que se note.
 */
const eyebrow = cva("font-mono uppercase", {
  variants: {
    size: {
      sm: "text-[9px]",
      md: "text-[10px]",
      lg: "text-[11px]",
    },
    tone: {
      label: "tracking-[0.2em]",
      action: "tracking-[0.14em]",
      meta: "tracking-[0.08em]",
    },
  },
  defaultVariants: { size: "md", tone: "label" },
})

type EyebrowProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof eyebrow> & {
    /** `p` cuando el rótulo es un párrafo por sí mismo; `span` por defecto. */
    as?: "span" | "p"
  }

export function Eyebrow({
  as: Tag = "span",
  size,
  tone,
  className,
  ...props
}: EyebrowProps) {
  return <Tag className={cn(eyebrow({ size, tone }), className)} {...props} />
}

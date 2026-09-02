import Link from "next/link"
import type { Metadata } from "next"

import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "No encontrado · FitFront",
}

/**
 * Sin esto, una URL inventada cae en el 404 por defecto de Next: fondo blanco,
 * Helvetica y en inglés, o sea nada que ver con el resto de la app.
 *
 * No lleva `AppHeader`: el header pide `/auth/me`, y acá se llega tanto con
 * sesión como sin ella.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 text-center">
      <Eyebrow as="p" className="font-semibold text-ember">
        Error 404
      </Eyebrow>
      <h1 className="mt-2 font-display text-5xl leading-[0.9] uppercase lg:text-6xl">
        Esta página
        <br />
        no existe
      </h1>
      <p className="mt-4 max-w-xs text-sm text-muted-foreground">
        El link que seguiste está roto o la pantalla ya no está donde estaba.
      </p>
      <Button
        asChild
        className="mt-7 h-11 px-6 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  )
}

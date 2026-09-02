"use client"

import Link from "next/link"
import { RotateCw } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"

/**
 * Pantalla de error de las rutas. Hermana de `not-found.tsx`, mismo lenguaje.
 *
 * NO muestra `error.message` en producción: los mensajes son de JavaScript, no
 * para alguien que está en el gimnasio con el celular en la mano, y pueden
 * filtrar detalles internos. Lo que sí sirve mostrar es el `digest`, que es lo
 * que Next deja para correlacionar con los logs del server — y es lo único que
 * se le puede pedir a alguien que lea en voz alta.
 *
 * En desarrollo se muestra el mensaje entero, que ahí sí es lo que uno quiere.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const detalle =
    process.env.NODE_ENV === "development" ? error.message : error.digest

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 text-center">
      <Eyebrow as="p" className="font-semibold text-destructive">
        Error
      </Eyebrow>
      <h1 className="mt-2 font-display text-5xl leading-[0.9] uppercase lg:text-6xl">
        Algo se
        <br />
        rompió
      </h1>
      <p className="mt-4 max-w-xs text-sm text-muted-foreground">
        No pudimos cargar esta pantalla. Probá de nuevo; si vuelve a pasar, no
        es cosa tuya.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
        <Button
          onClick={reset}
          className="h-11 px-6 text-[11px] font-semibold tracking-[0.16em] uppercase"
        >
          <RotateCw className="size-3.5" />
          Reintentar
        </Button>
        <Link
          href="/"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Volver al inicio
        </Link>
      </div>

      {detalle && (
        <p className="mt-8 max-w-sm font-mono text-[11px] break-words text-faint">
          {detalle}
        </p>
      )}
    </main>
  )
}

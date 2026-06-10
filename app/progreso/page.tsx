import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AppHeader } from "@/components/layout/app-header"

export const metadata: Metadata = {
  title: "Mi progreso · FitFront",
}

export default function ProgresoPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center lg:px-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
          Mi progreso
        </p>
        <h1 className="font-display text-4xl uppercase lg:text-5xl">
          En construcción
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Acá vas a ver tu progreso de entrenamiento. Lo diseñamos en el
          próximo paso.
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>
      </main>
    </>
  )
}

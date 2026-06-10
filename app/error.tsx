"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-lg font-semibold">Algo salió mal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Ocurrió un error inesperado."}
        </p>
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  )
}

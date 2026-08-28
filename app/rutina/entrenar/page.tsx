import type { Metadata } from "next"

import { EntrenarClient } from "@/components/routine/entrenar-client"

export const metadata: Metadata = {
  title: "Entrenando · FitFront",
}

/**
 * Wrapper de servidor. Lo único que hace es leer la posición desde la URL:
 * `?dia=<dayId>&ej=<dayExerciseId>`. Sin `dia` cae al primer día de la semana
 * en curso; sin `ej`, al primer ejercicio sin terminar.
 */
export default async function EntrenarPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; ej?: string }>
}) {
  const { dia, ej } = await searchParams

  return <EntrenarClient dayId={dia ?? null} exerciseId={ej ?? null} />
}

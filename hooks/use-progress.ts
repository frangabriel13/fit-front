"use client"

import { useQuery } from "@tanstack/react-query"

import { api, unwrap } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { ExerciseHistory, SplitProgress } from "@/types/api"

/**
 * Progreso del macrociclo: en qué semana estamos y el historial por ejercicio,
 * en una sola llamada. Van juntos porque el gráfico necesita las dos cosas — la
 * semana en curso es lo que distingue "hoy" de las semanas ya cerradas.
 */
export function useProgress(splitId: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.progress.forSplit(splitId, userId),
    queryFn: () =>
      unwrap<SplitProgress>(
        api.get(`/splits/${splitId}/progress`, {
          params: userId ? { userId } : undefined,
        })
      ),
    enabled: !!splitId,
  })
}

/** El historial indexado por nombre de ejercicio, que es como lo buscan las pantallas. */
export function historyByName(
  progress: SplitProgress | undefined
): Record<string, ExerciseHistory> {
  const map: Record<string, ExerciseHistory> = {}
  for (const ex of progress?.exercises ?? []) map[ex.name] = ex
  return map
}

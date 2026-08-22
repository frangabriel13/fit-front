"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { SaveStatus } from "@/components/workout/save-indicator"
import type { RowState } from "@/components/workout/set-row"
import { useSaveSetLogs } from "@/hooks/use-sessions"
import type { DayExercise, SetLogUpsert, WorkoutSession } from "@/types/api"

/**
 * La grilla de series del modo entrenamiento: estado local por celda +
 * guardado con debounce contra la API.
 *
 * Por qué el estado es local y no la query: escribís en varios campos seguidos
 * y cada tecla no puede ser un PUT. Se acumula acá, se agrupa por
 * `dayExerciseId:setNumber` y se manda en lote (ver use-sessions, que además
 * hace upsert optimista). Completar una serie sí guarda al toque: es el gesto
 * que cierra el trabajo y no querés perderlo si se corta.
 */

const SAVE_DELAY = 800

const emptyRow = (): RowState => ({
  actualReps: "",
  actualRir: "",
  weight: "",
  completed: false,
})

const rowKey = (exerciseId: string, setNumber: number) =>
  `${exerciseId}:${setNumber}`

/** Vacío → undefined (el campo no se manda), no 0. */
const toNum = (v: string): number | undefined => {
  if (v.trim() === "") return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

export function useSetLogGrid({
  sessionId,
  dayId,
  exercises,
  session,
}: {
  sessionId: string | null
  dayId: string
  exercises: DayExercise[]
  session: WorkoutSession | undefined
}) {
  const saveSetLogs = useSaveSetLogs(sessionId ?? "", dayId)

  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [status, setStatus] = useState<SaveStatus>("idle")
  const seededRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sembrar la grilla desde la sesión, una sola vez por sesión: si se re-sembrara
  // en cada refetch, pisaría lo que estás tipeando.
  useEffect(() => {
    if (!session) return
    if (seededRef.current === session.id) return
    seededRef.current = session.id

    const next: Record<string, RowState> = {}
    for (const log of session.setLogs) {
      next[rowKey(log.dayExerciseId, log.setNumber)] = {
        actualReps: log.actualReps?.toString() ?? "",
        actualRir: log.actualRir?.toString() ?? "",
        weight: log.weight?.toString() ?? "",
        completed: log.completed,
      }
    }
    setRows(next)
    setStatus("idle")
  }, [session])

  // Cuántas filas mostrar por ejercicio: las planificadas, o más si en alguna
  // sesión anterior se registraron series extra.
  const rowCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const exercise of exercises) {
      const maxLogged = session
        ? session.setLogs
            .filter((l) => l.dayExerciseId === exercise.id)
            .reduce((max, l) => Math.max(max, l.setNumber), 0)
        : 0
      counts[exercise.id] = Math.max(exercise.targetSets, maxLogged)
    }
    return counts
  }, [exercises, session])

  const buildPayload = useCallback(
    (current: Record<string, RowState>): SetLogUpsert[] => {
      const payload: SetLogUpsert[] = []
      for (const exercise of exercises) {
        const count = rowCounts[exercise.id] ?? exercise.targetSets
        for (let setNumber = 1; setNumber <= count; setNumber++) {
          const row = current[rowKey(exercise.id, setNumber)]
          if (!row) continue
          const reps = toNum(row.actualReps)
          const rir = toNum(row.actualRir)
          const weight = toNum(row.weight)
          // Una fila en blanco no se manda: no existe todavía.
          if (
            reps === undefined &&
            rir === undefined &&
            weight === undefined &&
            !row.completed
          )
            continue
          payload.push({
            dayExerciseId: exercise.id,
            setNumber,
            actualReps: reps,
            actualRir: rir,
            weight,
            completed: row.completed,
          })
        }
      }
      return payload
    },
    [exercises, rowCounts]
  )

  const flush = useCallback(
    (current: Record<string, RowState>) => {
      if (!sessionId) return
      const payload = buildPayload(current)
      if (payload.length === 0) {
        setStatus("idle")
        return
      }
      setStatus("saving")
      saveSetLogs.mutate(payload, {
        onSuccess: () => setStatus("saved"),
        onError: () => setStatus("error"),
      })
    },
    [sessionId, buildPayload, saveSetLogs]
  )

  const scheduleSave = useCallback(
    (current: Record<string, RowState>, immediate = false) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setStatus("dirty")
      if (immediate) {
        flush(current)
        return
      }
      timerRef.current = setTimeout(() => flush(current), SAVE_DELAY)
    },
    [flush]
  )

  // Cancelar el debounce pendiente al desmontar.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const writeRow = useCallback(
    (key: string, patch: Partial<RowState>, immediate: boolean) => {
      setRows((prev) => {
        const next = { ...prev, [key]: { ...(prev[key] ?? emptyRow()), ...patch } }
        scheduleSave(next, immediate)
        return next
      })
    },
    [scheduleSave]
  )

  return {
    status,
    rowCounts,
    getRow: useCallback(
      (exerciseId: string) =>
        (setNumber: number): RowState =>
          rows[rowKey(exerciseId, setNumber)] ?? emptyRow(),
      [rows]
    ),
    onFieldChange: useCallback(
      (
        exerciseId: string,
        setNumber: number,
        field: keyof RowState,
        value: string
      ) => writeRow(rowKey(exerciseId, setNumber), { [field]: value }, false),
      [writeRow]
    ),
    onToggleComplete: useCallback(
      (exerciseId: string, setNumber: number, completed: boolean) =>
        writeRow(rowKey(exerciseId, setNumber), { completed }, true),
      [writeRow]
    ),
    retry: useCallback(() => flush(rows), [flush, rows]),
  }
}

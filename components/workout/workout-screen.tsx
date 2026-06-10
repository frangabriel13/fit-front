"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import type { Day, SetLogUpsert } from "@/types/api"
import { useSplit } from "@/hooks/use-splits"
import {
  useCreateSession,
  useSaveSetLogs,
  useSession,
  useSessions,
} from "@/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExerciseBlock } from "@/components/workout/exercise-block"
import { SessionHistorySheet } from "@/components/workout/session-history-sheet"
import { SaveIndicator, type SaveStatus } from "@/components/workout/save-indicator"
import type { RowState } from "@/components/workout/set-row"

const SAVE_DELAY = 800
const emptyRow = (): RowState => ({
  actualReps: "",
  actualRir: "",
  weight: "",
  completed: false,
})
const rowKey = (exerciseId: string, setNumber: number) =>
  `${exerciseId}:${setNumber}`

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const toNum = (v: string): number | undefined => {
  if (v.trim() === "") return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

export function WorkoutScreen({
  splitId,
  dayId,
}: {
  splitId: string
  dayId: string
}) {
  const { data: split, isLoading: loadingSplit } = useSplit(splitId)
  const day: Day | undefined = useMemo(
    () =>
      split?.microcycles
        .flatMap((m) => m.days)
        .find((d) => d.id === dayId),
    [split, dayId]
  )
  const exercises = useMemo(
    () => [...(day?.exercises ?? [])].sort((a, b) => a.order - b.order),
    [day]
  )

  const sessionsQuery = useSessions(dayId)
  const createSession = useCreateSession(dayId)
  const ensuredRef = useRef(false)

  // Sesión de hoy (si existe) derivada de la lista.
  const todaysSessionId = useMemo(() => {
    if (!sessionsQuery.isSuccess) return null
    const todays = sessionsQuery.data
      .filter((s) => isToday(s.performedAt))
      .sort(
        (a, b) =>
          new Date(b.performedAt).getTime() -
          new Date(a.performedAt).getTime()
      )[0]
    return todays?.id ?? null
  }, [sessionsQuery.isSuccess, sessionsQuery.data])

  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  const activeSessionId = createdSessionId ?? todaysSessionId

  // Crear o reanudar: si no hay sesión de hoy, crea una (efecto sobre la API).
  useEffect(() => {
    if (ensuredRef.current) return
    if (!sessionsQuery.isSuccess) return
    if (todaysSessionId) {
      ensuredRef.current = true
      return
    }
    ensuredRef.current = true
    createSession.mutate(undefined, {
      onSuccess: (session) => setCreatedSessionId(session.id),
      onError: () => {
        ensuredRef.current = false
        toast.error("No se pudo iniciar la sesión.")
      },
    })
  }, [sessionsQuery.isSuccess, todaysSessionId, createSession])

  const sessionQuery = useSession(activeSessionId)
  const saveSetLogs = useSaveSetLogs(activeSessionId ?? "", dayId)

  // Estado local de la grilla, sembrado desde la sesión.
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const seededRef = useRef<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const session = sessionQuery.data
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
  }, [sessionQuery.data])

  const rowCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const session = sessionQuery.data
    for (const exercise of exercises) {
      const maxLogged = session
        ? session.setLogs
            .filter((l) => l.dayExerciseId === exercise.id)
            .reduce((max, l) => Math.max(max, l.setNumber), 0)
        : 0
      counts[exercise.id] = Math.max(exercise.targetSets, maxLogged)
    }
    return counts
  }, [exercises, sessionQuery.data])

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
          const hasData =
            reps !== undefined ||
            rir !== undefined ||
            weight !== undefined ||
            row.completed
          if (!hasData) continue
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
      if (!activeSessionId) return
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
    [activeSessionId, buildPayload, saveSetLogs]
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

  // Flush pendiente al salir.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const getRow = useCallback(
    (exerciseId: string) =>
      (setNumber: number): RowState =>
        rows[rowKey(exerciseId, setNumber)] ?? emptyRow(),
    [rows]
  )

  const onFieldChange = useCallback(
    (
      exerciseId: string,
      setNumber: number,
      field: keyof RowState,
      value: string
    ) => {
      setRows((prev) => {
        const key = rowKey(exerciseId, setNumber)
        const next = {
          ...prev,
          [key]: { ...(prev[key] ?? emptyRow()), [field]: value },
        }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  const onToggleComplete = useCallback(
    (exerciseId: string, setNumber: number, completed: boolean) => {
      setRows((prev) => {
        const key = rowKey(exerciseId, setNumber)
        const next = {
          ...prev,
          [key]: { ...(prev[key] ?? emptyRow()), completed },
        }
        scheduleSave(next, true) // guardado inmediato al completar
        return next
      })
    },
    [scheduleSave]
  )

  const retry = useCallback(() => flush(rows), [flush, rows])

  // ---- Render ----

  const isPreparing =
    loadingSplit ||
    sessionsQuery.isLoading ||
    createSession.isPending ||
    (!!activeSessionId && sessionQuery.isLoading)

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/splits/${splitId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        {day && <SessionHistorySheet dayId={dayId} exercises={exercises} />}
      </div>

      {day && (
        <div>
          <h1 className="text-xl font-semibold">{day.name}</h1>
          <p className="text-sm text-muted-foreground">Modo entrenamiento</p>
        </div>
      )}

      {isPreparing && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isPreparing && !day && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No se encontró este día.
        </div>
      )}

      {!isPreparing && day && exercises.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Este día no tiene ejercicios. Agregalos desde el editor.
        </div>
      )}

      {!isPreparing && day && exercises.length > 0 && (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseBlock
              key={exercise.id}
              exercise={exercise}
              rowCount={rowCounts[exercise.id] ?? exercise.targetSets}
              getRow={getRow(exercise.id)}
              onFieldChange={(setNumber, field, value) =>
                onFieldChange(exercise.id, setNumber, field, value)
              }
              onToggleComplete={(setNumber, completed) =>
                onToggleComplete(exercise.id, setNumber, completed)
              }
            />
          ))}
        </div>
      )}

      {/* Indicador de guardado fijo abajo */}
      {activeSessionId && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-end px-4 py-3">
            <SaveIndicator status={status} onRetry={retry} />
          </div>
        </div>
      )}
    </div>
  )
}

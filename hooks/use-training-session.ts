"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { SheetItem } from "@/lib/sheet"
import type { Draft, Field } from "@/components/routine/entrenar/types"
import { numStr, parseNum, round2, sanitizeDecimal, sanitizeInt } from "@/lib/num"
import {
  useDeleteSetLog,
  useSaveSetLogs,
  useUpdateSession,
} from "@/hooks/use-sessions"
import { entriesFor, findSetLogId } from "@/lib/set-logs"
import { e1rm, topE1RM, type SetEntry, type SetStatus } from "@/lib/training-math"
import type { ExerciseHistory, SetLogUpsert, WorkoutSession } from "@/types/api"

/**
 * Estado del modo entrenamiento para UN slot de la planilla (un ejercicio, o
 * los miembros A/B de una superserie).
 *
 * El registro es local Y remoto a la vez, a propósito: la pantalla responde al
 * toque sin esperar la red (el borrador, el cursor y el descanso son estado de
 * UI) y cada serie cerrada se manda al toque — completar una serie es un gesto
 * deliberado, no algo que convenga agrupar con debounce como la grilla de
 * `/splits`. Si el guardado falla se avisa; lo cargado no se pierde de la
 * pantalla.
 */

/** Cursor sobre (ronda, miembro): la unidad que se está cargando ahora. */
export interface Cursor {
  round: number
  member: number
}

/** Pasos por celda: kilos finos para el peso, enteros para las reps. */
const DEFAULT_STEPS: Record<Field, number> = { weight: 2.5, reps: 1 }

/**
 * Primera unidad sin cargar, en el orden real de ejecución: en biserie
 * A1 → B1 → A2 → B2…; en serie simple solo avanza la ronda.
 */
function firstPending(logs: SetEntry[][], rounds: number): Cursor {
  for (let r = 0; r < rounds; r++)
    for (let m = 0; m < logs.length; m++)
      if (logs[m][r]?.status === "pending") return { round: r, member: m }
  return { round: rounds - 1, member: logs.length - 1 }
}

/** La unidad siguiente en ese mismo orden; se queda en la última si terminó. */
function advance(c: Cursor, rounds: number, memberCount: number): Cursor {
  let m = c.member + 1
  let r = c.round
  if (m >= memberCount) {
    m = 0
    r += 1
  }
  return r >= rounds ? c : { round: r, member: m }
}

/** La última semana cerrada de un ejercicio: la referencia contra la que se compara. */
function lastWeekOf(
  history: Record<string, ExerciseHistory>,
  name: string
) {
  return history[name]?.weeks.at(-1) ?? null
}

/**
 * Valores de arranque del borrador: si la unidad ya está hecha, sus propios
 * valores; si está pendiente, la última serie hecha del miembro (overload); si
 * no hay nada esta sesión, el peso de la semana pasada.
 */
function prefill(
  logs: SetEntry[][],
  members: SheetItem[],
  member: number,
  round: number,
  history: Record<string, ExerciseHistory>
): Draft {
  const entry = logs[member]?.[round]
  if (entry?.status === "done")
    return {
      weight: numStr(entry.weight),
      reps: numStr(entry.reps),
      rir: numStr(entry.rir),
    }
  for (let r = round - 1; r >= 0; r--) {
    const e = logs[member]?.[r]
    if (e?.status === "done")
      return { weight: numStr(e.weight), reps: numStr(e.reps), rir: numStr(e.rir) }
  }
  const lastWeek = lastWeekOf(history, members[member].ex.name)
  const ref = lastWeek?.[round] ?? lastWeek?.[0]
  return { weight: numStr(ref?.weight), reps: "", rir: "" }
}

/** Todo pendiente: lo que se muestra hasta que llega la sesión. */
function blank(members: SheetItem[]): SetEntry[][] {
  return members.map((it) =>
    Array.from({ length: it.ex.sets }, () => ({ status: "pending" as const }))
  )
}

/** El registro tal como quedó guardado en la sesión de hoy. */
function seedFrom(session: WorkoutSession, members: SheetItem[]): SetEntry[][] {
  return members.map((it) =>
    entriesFor(session.setLogs, it.ex.id, it.ex.sets)
  )
}

/** Una serie de la planilla en la forma que espera el upsert de la API. */
function toUpsert(
  exerciseId: string,
  setNumber: number,
  entry: SetEntry
): SetLogUpsert {
  if (entry.status === "skipped")
    return { dayExerciseId: exerciseId, setNumber, completed: false, skipped: true }
  return {
    dayExerciseId: exerciseId,
    setNumber,
    completed: true,
    skipped: false,
    weight: entry.weight,
    actualReps: entry.reps,
    actualRir: entry.rir,
  }
}

export function useTrainingSession({
  members,
  session,
  sessionId,
  dayId,
  history,
}: {
  members: SheetItem[]
  session: WorkoutSession | undefined
  sessionId: string | null
  dayId: string
  history: Record<string, ExerciseHistory>
}) {
  const rounds = members[0].ex.sets

  const saveSetLogs = useSaveSetLogs(sessionId ?? "", dayId)
  const deleteSetLog = useDeleteSetLog(sessionId ?? "", dayId)
  const updateSession = useUpdateSession(sessionId ?? "", dayId)

  // Registro por miembro (A/B…) × ronda. Los tres estados se encadenan: el
  // cursor sale del registro y el borrador, del cursor.
  const [memberLogs, setMemberLogs] = useState<SetEntry[][]>(() => blank(members))
  const [cursor, setCursor] = useState<Cursor>({ round: 0, member: 0 })
  const [draft, setDraft] = useState<Draft>(() =>
    prefill(blank(members), members, 0, 0, history)
  )
  // Celda enfocada + paso elegido para cada una: el stepper es uno solo.
  const [field, setField] = useState<Field>("weight")
  const [steps, setSteps] = useState<Record<Field, number>>(DEFAULT_STEPS)
  // Descanso: aparece recién al completar una serie / cerrar una vuelta.
  const [resting, setResting] = useState(false)

  // Sembrar desde la sesión UNA sola vez: los refetch posteriores (los dispara
  // cada guardado) no pueden pisar lo que estás cargando en pantalla.
  const seededRef = useRef<string | null>(null)
  useEffect(() => {
    if (!session) return
    if (seededRef.current === session.id) return
    seededRef.current = session.id
    const logs = seedFrom(session, members)
    const c = firstPending(logs, rounds)
    setMemberLogs(logs)
    setCursor(c)
    setDraft(prefill(logs, members, c.member, c.round, history))
    setField("weight")
    setResting(false)
  }, [session, members, rounds, history])

  const activeMember = members[cursor.member] ?? members[0]
  const ex = activeMember.ex

  // ── persistencia ──────────────────────────────────────────────────────────

  const push = useCallback(
    (upserts: SetLogUpsert[]) => {
      if (!sessionId || upserts.length === 0) return
      saveSetLogs.mutate(upserts, {
        onError: () => toast.error("No se pudo guardar la serie."),
      })
    },
    [sessionId, saveSetLogs]
  )

  /** Borra del servidor las series de estas rondas (resetear = volver a pendiente). */
  const drop = useCallback(
    (roundIndexes: number[]) => {
      if (!sessionId) return
      const ids: string[] = []
      for (const round of roundIndexes) {
        for (const it of members) {
          const id = findSetLogId(session, it.ex.id, round + 1)
          if (id) ids.push(id)
        }
      }
      if (ids.length === 0) return

      // Avisar si falla importa más acá que en el resto de la pantalla: la
      // grilla ya se vació en local y NO se vuelve a sembrar desde la sesión
      // (ver `seededRef`), así que un DELETE que falla deja la serie viva en el
      // servidor sin que nada en pantalla lo delate.
      //
      // `mutateAsync` y no `mutate` con `onError`: reiniciar una biserie —o el
      // ejercicio entero— dispara varios DELETE del MISMO hook, y el observer
      // de TanStack solo conserva los callbacks del último `mutate`, así que el
      // fallo de cualquiera de los anteriores no avisaría nada. La promesa sí
      // llega siempre. El rollback de la caché vive en el hook y corre igual.
      //
      // Un aviso por reinicio y no uno por serie: si falla, falla por lo mismo.
      void Promise.allSettled(ids.map((id) => deleteSetLog.mutateAsync(id))).then(
        (results) => {
          if (results.some((r) => r.status === "rejected"))
            toast.error("No se pudo reiniciar.")
        }
      )
    },
    [sessionId, members, session, deleteSetLog]
  )

  // ── derivados ─────────────────────────────────────────────────────────────

  const unitStatuses: SetStatus[] = Array.from({ length: rounds }, (_, r) => {
    const entries = members.map((_, m) => memberLogs[m]?.[r])
    if (entries.every((e) => e?.status === "done")) return "done"
    if (entries.every((e) => e?.status === "skipped")) return "skipped"
    return "pending"
  })
  const allClosed = unitStatuses.every((s) => s !== "pending")
  const slotState = unitStatuses.every((s) => s === "done")
    ? ("done" as const)
    : unitStatuses.some((s) => s !== "pending")
      ? ("in-progress" as const)
      : ("pending" as const)

  const lastWeek = lastWeekOf(history, ex.name)
  const refSet = lastWeek?.[cursor.round] ?? lastWeek?.[0] ?? null
  const refTop = lastWeek ? topE1RM(lastWeek) : null
  /** Número de la semana de referencia: el historial es denso desde la 1. */
  const refWeek = history[ex.name]?.weeks.length ?? 0

  const draftWeight = parseNum(draft.weight)
  const draftReps = parseNum(draft.reps)
  const draftRir = parseNum(draft.rir)

  const liveE1rm =
    draftWeight != null && draftReps != null
      ? Math.round(e1rm(draftWeight, draftReps))
      : null
  const refE1rm = refTop != null ? Math.round(refTop) : null
  const e1rmDelta =
    liveE1rm != null && refE1rm != null ? liveE1rm - refE1rm : null

  const canDec = field === "weight" ? (draftWeight ?? 0) > 0 : (draftReps ?? 0) > 0
  const canComplete = draftWeight != null && draftReps != null

  // ── transiciones ──────────────────────────────────────────────────────────

  function writeAndMove(entry: SetEntry) {
    const next = memberLogs.map((arr) => arr.slice())
    next[cursor.member][cursor.round] = entry
    const nc = advance(cursor, rounds, members.length)
    setMemberLogs(next)
    setCursor(nc)
    setDraft(prefill(next, members, nc.member, nc.round, history))
    setField("weight")
    push([toUpsert(members[cursor.member].ex.id, cursor.round + 1, entry)])
  }

  /** Cierra la unidad en curso. En biserie el descanso llega recién al cerrar
   *  la vuelta (tras la última estación); en serie simple, siempre. */
  function completeUnit() {
    const closesRound = cursor.member === members.length - 1
    writeAndMove({
      status: "done",
      weight: draftWeight ?? undefined,
      reps: draftReps ?? undefined,
      rir: draftRir ?? undefined,
    })
    setResting(closesRound)
  }

  function skipUnit() {
    writeAndMove({ status: "skipped" })
    setResting(false)
  }

  /** Volver a una ronda ya registrada para corregirla. */
  function goToRound(round: number) {
    setCursor({ round, member: 0 })
    setDraft(prefill(memberLogs, members, 0, round, history))
    setField("weight")
    setResting(false)
  }

  // Reset/omitir operan a nivel ronda (en biserie, A y B juntas).
  function resetRound(round: number) {
    const next = memberLogs.map((arr) => arr.slice())
    members.forEach((_, m) => (next[m][round] = { status: "pending" }))
    setMemberLogs(next)
    setCursor({ round, member: 0 })
    setDraft(prefill(next, members, 0, round, history))
    setField("weight")
    setResting(false)
    drop([round])
  }

  function omitRound(round: number) {
    const next = memberLogs.map((arr) => arr.slice())
    members.forEach((_, m) => (next[m][round] = { status: "skipped" }))
    setMemberLogs(next)
    push(
      members.map((it) =>
        toUpsert(it.ex.id, round + 1, { status: "skipped" })
      )
    )
  }

  function resetExercise() {
    const cleared = blank(members)
    setMemberLogs(cleared)
    setCursor({ round: 0, member: 0 })
    setDraft(prefill(cleared, members, 0, 0, history))
    setField("weight")
    setResting(false)
    drop(Array.from({ length: rounds }, (_, r) => r))
  }

  /** Suma/resta sobre la celda enfocada, con su propio paso. */
  function bump(dir: 1 | -1) {
    const step = steps[field]
    setDraft((d) => {
      if (field === "weight") {
        const v = round2(Math.max(0, (parseNum(d.weight) ?? 0) + dir * step))
        return { ...d, weight: String(v) }
      }
      const v = Math.max(0, (parseNum(d.reps) ?? 0) + dir * step)
      return { ...d, reps: String(v) }
    })
  }

  return {
    // plan
    rounds,
    activeMember,
    exercise: ex,
    // estado
    memberLogs,
    cursor,
    draft,
    field,
    step: steps[field],
    resting,
    saving: saveSetLogs.isPending || deleteSetLog.isPending,
    // derivados
    unitStatuses,
    allClosed,
    /**
     * El entrenamiento del día ya se dio por terminado. Mientras sea `false` lo
     * cargado es parcial, y el gráfico de progresión no lo usa para medir.
     */
    sessionClosed: session?.completedAt != null,
    finishing: updateSession.isPending,
    slotState,
    refSet,
    refWeek,
    refE1rm,
    liveE1rm,
    e1rmDelta,
    draftRir,
    canDec,
    canComplete,
    // acciones
    focus: setField,
    setStep: (v: number) => setSteps((s) => ({ ...s, [field]: v })),
    setWeight: (raw: string) =>
      setDraft((d) => ({ ...d, weight: sanitizeDecimal(raw) })),
    setReps: (raw: string) => setDraft((d) => ({ ...d, reps: sanitizeInt(raw) })),
    setRir: (n: number) => setDraft((d) => ({ ...d, rir: String(n) })),
    matchReference: (weight: number, reps: number) =>
      setDraft((d) => ({ ...d, weight: String(weight), reps: String(reps) })),
    bump,
    completeUnit,
    skipUnit,
    goToRound,
    resetRound,
    omitRound,
    resetExercise,
    endRest: () => setResting(false),
    /**
     * Cierra el entrenamiento del día (`PATCH /sessions/:id`).
     *
     * Es lo que convierte lo cargado en historial comparable: hasta que no se
     * cierra, la sesión es parcial. Devuelve si salió bien para que el call
     * site decida si navegar — no vale irse de la pantalla dando por cerrado
     * algo que quedó abierto.
     */
    /** Vuelve a abrir un día ya cerrado, para seguir cargando. */
    reopen: () => {
      if (!sessionId) return
      updateSession.mutate(
        { completed: false },
        { onError: () => toast.error("No se pudo reabrir el día.") }
      )
    },
    finish: async (): Promise<boolean> => {
      if (!sessionId) return false
      try {
        await updateSession.mutateAsync({ completed: true })
        return true
      } catch {
        toast.error("No se pudo terminar el entrenamiento.")
        return false
      }
    },
  }
}

"use client"

import { useState } from "react"

import type { SheetItem } from "@/components/routine/sheet-bits"
import type { Draft, Field } from "@/components/routine/entrenar/types"
import { numStr, parseNum, round2, sanitizeDecimal, sanitizeInt } from "@/lib/num"
import { HISTORY, SESSION } from "@/lib/routine-data"
import { e1rm, topE1RM, type SetEntry, type SetStatus } from "@/lib/training-math"

/**
 * Estado del modo entrenamiento para UN slot de la planilla (un ejercicio, o
 * los miembros A/B de una superserie).
 *
 * Hoy vive en memoria y se siembra de los mocks SESSION/HISTORY: al recargar se
 * pierde. Cuando exista el backend, este hook es la única pieza que cambia —
 * pasa a envolver a `use-sessions` como hace /splits. Los componentes de
 * `components/routine/entrenar/` no se enteran.
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

/**
 * Valores de arranque del borrador: si la unidad ya está hecha, sus propios
 * valores; si está pendiente, la última serie hecha del miembro (overload); si
 * no hay nada esta sesión, el peso de la semana pasada.
 */
function prefill(
  logs: SetEntry[][],
  members: SheetItem[],
  member: number,
  round: number
): Draft {
  const entry = logs[member][round]
  if (entry.status === "done")
    return {
      weight: numStr(entry.weight),
      reps: numStr(entry.reps),
      rir: numStr(entry.rir),
    }
  for (let r = round - 1; r >= 0; r--) {
    const e = logs[member][r]
    if (e.status === "done")
      return { weight: numStr(e.weight), reps: numStr(e.reps), rir: numStr(e.rir) }
  }
  const lastWeek = HISTORY[members[member].ex.name]?.weeks.at(-1)
  const ref = lastWeek?.[round] ?? lastWeek?.[0]
  return { weight: numStr(ref?.weight), reps: "", rir: "" }
}

/** Registro inicial: lo que ya venía de la sesión de hoy, o todo pendiente. */
function seed(members: SheetItem[]): SetEntry[][] {
  return members.map((it) =>
    Array.from({ length: it.ex.sets }, (_, i) => ({
      ...(SESSION.logs[it.ex.name]?.[i] ?? { status: "pending" as const }),
    }))
  )
}

export function useTrainingSession(members: SheetItem[]) {
  const rounds = members[0].ex.sets

  // Registro por miembro (A/B…) × ronda, sembrado del mock. Los tres estados
  // se encadenan: el cursor sale del registro y el borrador, del cursor.
  const [memberLogs, setMemberLogs] = useState<SetEntry[][]>(() => seed(members))
  const [cursor, setCursor] = useState<Cursor>(() =>
    firstPending(memberLogs, rounds)
  )
  const [draft, setDraft] = useState<Draft>(() =>
    prefill(memberLogs, members, cursor.member, cursor.round)
  )
  // Celda enfocada + paso elegido para cada una: el stepper es uno solo.
  const [field, setField] = useState<Field>("weight")
  const [steps, setSteps] = useState<Record<Field, number>>(DEFAULT_STEPS)
  // Descanso: aparece recién al completar una serie / cerrar una vuelta.
  const [resting, setResting] = useState(false)

  const activeMember = members[cursor.member]
  const ex = activeMember.ex

  // ── derivados ─────────────────────────────────────────────────────────────

  const unitStatuses: SetStatus[] = Array.from({ length: rounds }, (_, r) => {
    const entries = members.map((_, m) => memberLogs[m][r])
    if (entries.every((e) => e.status === "done")) return "done"
    if (entries.every((e) => e.status === "skipped")) return "skipped"
    return "pending"
  })
  const allClosed = unitStatuses.every((s) => s !== "pending")
  const slotState = unitStatuses.every((s) => s === "done")
    ? ("done" as const)
    : unitStatuses.some((s) => s !== "pending")
      ? ("in-progress" as const)
      : ("pending" as const)

  const lastWeek = HISTORY[ex.name]?.weeks.at(-1)
  const refSet = lastWeek?.[cursor.round] ?? lastWeek?.[0] ?? null
  const refTop = lastWeek ? topE1RM(lastWeek) : null

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
    setDraft(prefill(next, members, nc.member, nc.round))
    setField("weight")
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
    setDraft(prefill(memberLogs, members, 0, round))
    setField("weight")
    setResting(false)
  }

  // Reset/omitir operan a nivel ronda (en biserie, A y B juntas).
  function resetRound(round: number) {
    const next = memberLogs.map((arr) => arr.slice())
    members.forEach((_, m) => (next[m][round] = { status: "pending" }))
    setMemberLogs(next)
    setCursor({ round, member: 0 })
    setDraft(prefill(next, members, 0, round))
    setField("weight")
    setResting(false)
  }

  function omitRound(round: number) {
    const next = memberLogs.map((arr) => arr.slice())
    members.forEach((_, m) => (next[m][round] = { status: "skipped" }))
    setMemberLogs(next)
  }

  function resetExercise() {
    const cleared = members.map((it) =>
      Array.from({ length: it.ex.sets }, () => ({ status: "pending" as const }))
    )
    setMemberLogs(cleared)
    setCursor({ round: 0, member: 0 })
    setDraft(prefill(cleared, members, 0, 0))
    setField("weight")
    setResting(false)
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
    // derivados
    unitStatuses,
    allClosed,
    slotState,
    refSet,
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
  }
}

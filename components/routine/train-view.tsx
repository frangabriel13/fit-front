"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Pencil, RotateCcw, X } from "lucide-react"

import {
  exerciseState,
  HISTORY,
  ROUTINE,
  SESSION,
  type ExerciseState,
  type HistSet,
  type RoutineDay,
  type SetEntry,
} from "@/lib/routine-data"
import { formatClock, parseRest } from "@/lib/rest"
import { useRestTimer, type RestTimer } from "@/hooks/use-rest-timer"
import {
  ProgressionRail,
  SetTally,
  sheet,
  toSheetItems,
  type SheetItem,
} from "@/components/routine/sheet-bits"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Estado EN MEMORIA sobre el mock (lib/routine-data): se pierde al refrescar
// y /rutina sigue mostrando el SESSION original. La persistencia llega con el
// backend (ver components/workout/workout-screen.tsx para el patrón real).

// ─── tipos y helpers de datos ────────────────────────────────────────────────

type SessionLogs = Record<string, SetEntry[]>
/** Inputs controlados siempre como strings (patrón workout-screen). */
type DraftInputs = { weight: string; reps: string; rir: string }
type EditTarget = { name: string; setIdx: number } | null

interface Slot {
  num: string
  items: SheetItem[]
}

/** Posición activa dentro del slot: miembro (A/B) + índice de serie/vuelta. */
interface Cursor {
  member: SheetItem
  memberIdx: number
  setIdx: number
}

function toSlots(items: SheetItem[]): Slot[] {
  const slots: Slot[] = []
  for (const it of items) {
    const last = slots[slots.length - 1]
    if (last && last.num === it.num) last.items.push(it)
    else slots.push({ num: it.num, items: [it] })
  }
  return slots
}

function slotState(slot: Slot, logs: SessionLogs): ExerciseState {
  const states = slot.items.map((it) => exerciseState(logs[it.ex.name]))
  if (states.every((s) => s === "done")) return "done"
  if (states.some((s) => s !== "pending")) return "in-progress"
  return "pending"
}

function slotTitle(slot: Slot): string {
  return slot.items.length > 1
    ? slot.items.map((it) => it.ex.name).join(" + ")
    : slot.items[0].ex.name
}

/** Clon profundo del mock: mutar SESSION filtraría estado a /rutina. */
function initLogs(day: RoutineDay): SessionLogs {
  const out: SessionLogs = {}
  for (const ex of day.exercises) {
    const src = SESSION.logs[ex.name]
    out[ex.name] = Array.from({ length: ex.sets }, (_, i) =>
      src?.[i] ? { ...src[i] } : { status: "pending" as const }
    )
  }
  return out
}

/**
 * Primera entrada pendiente recorriendo vuelta × miembro: en biserie,
 * completar A[v] mueve el cursor a B[v]; completar B[v] abre la vuelta v+1.
 * null ⇒ slot completo. Borrar un registro anterior reactiva esa serie.
 */
function cursorOf(slot: Slot, logs: SessionLogs): Cursor | null {
  const maxSets = Math.max(...slot.items.map((it) => it.ex.sets))
  for (let v = 0; v < maxSets; v++) {
    for (let m = 0; m < slot.items.length; m++) {
      const entry = logs[slot.items[m].ex.name]?.[v]
      if (entry?.status === "pending")
        return { member: slot.items[m], memberIdx: m, setIdx: v }
    }
  }
  return null
}

/** Peso prefilled: misma serie de la semana anterior → última done de hoy → vacío. */
function prefillDraft(
  name: string,
  setIdx: number,
  logs: SessionLogs
): DraftInputs {
  const histWeight = HISTORY[name]?.lastWeek[setIdx]?.weight
  if (histWeight != null)
    return { weight: String(histWeight), reps: "", rir: "" }
  const lastDone = [...(logs[name] ?? [])]
    .reverse()
    .find((s) => s.status === "done")
  return {
    weight: lastDone?.weight != null ? String(lastDone.weight) : "",
    reps: "",
    rir: "",
  }
}

const EMPTY_DRAFT: DraftInputs = { weight: "", reps: "", rir: "" }

const toNum = (v: string): number | undefined => {
  const t = v.trim().replace(",", ".")
  if (t === "") return undefined
  const n = Number(t)
  return Number.isNaN(n) ? undefined : n
}

const DAY: RoutineDay =
  ROUTINE.days.find((d) => d.id === SESSION.dayId) ?? ROUTINE.days[0]
const SLOTS = toSlots(toSheetItems(DAY.exercises))

function firstOpenSlot(logs: SessionLogs): number {
  const i = SLOTS.findIndex((s) => slotState(s, logs) !== "done")
  return i === -1 ? SLOTS.length - 1 : i
}

function draftFor(slot: Slot, logs: SessionLogs): DraftInputs {
  const cur = cursorOf(slot, logs)
  return cur ? prefillDraft(cur.member.ex.name, cur.setIdx, logs) : EMPTY_DRAFT
}

// ─── piezas visuales ─────────────────────────────────────────────────────────

/** Campo de "formulario de papel": input grande sobre subrayado punteado. */
function PaperInput({
  label,
  value,
  onChange,
  suffix,
  hint,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  hint?: string
  inputMode: "decimal" | "numeric"
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-label text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1 border-b border-dashed border-input pb-1.5 transition-colors focus-within:border-solid focus-within:border-primary">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          enterKeyHint="done"
          placeholder="—"
          aria-label={label}
          className="w-full min-w-0 bg-transparent font-display text-3xl leading-none text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        {suffix && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-1.5 font-mono text-[9px] text-muted-foreground/60">
        {hint ?? " "}
      </p>
    </div>
  )
}

/** Registro de una serie + delta vs la misma serie de la semana anterior. */
function SetRecord({ s, prev }: { s: SetEntry; prev?: HistSet }) {
  if (s.status === "done") {
    const delta = s.weight != null && prev ? s.weight - prev.weight : null
    return (
      <span className="text-foreground/90">
        {s.weight}
        <span className="text-muted-foreground"> kg</span> × {s.reps}
        {s.rir != null && (
          <span className="text-muted-foreground"> · RIR {s.rir}</span>
        )}
        {delta != null && delta !== 0 && (
          <span
            className={cn(
              "ml-2 text-[11px]",
              delta > 0 ? "text-primary" : "text-muted-foreground"
            )}
          >
            {delta > 0 ? "↑" : "↓"} {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </span>
    )
  }
  if (s.status === "skipped")
    return (
      <span className="text-muted-foreground italic line-through decoration-muted-foreground/40">
        omitida
      </span>
    )
  return (
    <span className="text-muted-foreground/60">
      sin registrar
      {prev && (
        <span className="text-muted-foreground/60">
          {" "}
          · sem. ant. {prev.weight}×{prev.reps}
        </span>
      )}
    </span>
  )
}

/** Línea del ledger: tally + etiqueta + registro + acciones editar/eliminar. */
function LedgerLine({
  tag,
  status,
  onEdit,
  onClear,
  children,
}: {
  tag: string
  status: SetEntry["status"]
  onEdit?: () => void
  onClear?: () => void
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground/60">
        {tag}
      </span>
      <SetTally status={status} />
      <span className="flex-1 font-mono text-[13px]">{children}</span>
      {(onEdit || onClear) && (
        <span className="flex items-center gap-0.5 text-muted-foreground/60">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Editar ${tag}`}
              className="cursor-pointer rounded p-1 transition-colors hover:text-foreground"
            >
              <Pencil className="size-3" />
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label={`Eliminar registro de ${tag}`}
              className="cursor-pointer rounded p-1 transition-colors hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      )}
    </li>
  )
}

const labelBtn =
  "cursor-pointer font-label text-xs font-medium tracking-[0.12em] uppercase transition-colors"

/** Panel de descanso: reloj protagonista + barra + acciones. */
function RestPanel({
  timer,
  followUp,
  onStartNext,
  children,
}: {
  timer: RestTimer
  followUp: string
  onStartNext?: string
  children?: React.ReactNode
}) {
  const elapsed =
    timer.total > 0 ? ((timer.total - timer.seconds) / timer.total) * 100 : 100
  return (
    <div className="fade-up py-2 text-center">
      <p
        className={cn(
          "font-label text-xs font-medium tracking-[0.12em] uppercase",
          timer.finished ? "text-primary" : "text-ember"
        )}
      >
        {!timer.finished && (
          <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-ember align-middle" />
        )}
        {timer.finished ? "descanso cumplido" : "descansando"} — {followUp}
      </p>

      <p
        className={cn(
          "mt-4 font-display text-7xl leading-none tabular-nums",
          timer.finished ? "animate-pulse text-primary" : "text-foreground"
        )}
      >
        {formatClock(timer.seconds)}
      </p>

      <div className="mx-auto mt-5 h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            timer.finished
              ? "bg-primary shadow-[0_0_8px] shadow-primary/60"
              : "bg-ember"
          )}
          style={{ width: `${elapsed}%` }}
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        {timer.finished && onStartNext ? (
          <Button
            onClick={timer.skip}
            className="h-11 px-6 font-label text-xs font-medium tracking-[0.12em] uppercase shadow-[0_0_16px_-4px] shadow-primary/50"
          >
            {onStartNext}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => timer.extend(30)}
              className={cn(labelBtn, "text-foreground hover:text-primary")}
            >
              +30s
            </button>
            <button
              type="button"
              onClick={timer.skip}
              className={cn(
                labelBtn,
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Saltar descanso
            </button>
          </>
        )}
      </div>

      {children}
    </div>
  )
}

// ─── vista principal ─────────────────────────────────────────────────────────

export function TrainView() {
  const [logs, setLogs] = useState<SessionLogs>(() => initLogs(DAY))
  const [slotIdx, setSlotIdx] = useState(() => firstOpenSlot(initLogs(DAY)))
  const [draft, setDraft] = useState<DraftInputs>(() => {
    const initial = initLogs(DAY)
    return draftFor(SLOTS[firstOpenSlot(initial)], initial)
  })
  const [editing, setEditing] = useState<EditTarget>(null)
  const timer = useRestTimer()

  const slot = SLOTS[slotIdx]
  const isSuper = slot.items.length > 1
  const cursor = cursorOf(slot, logs)
  const unit = isSuper ? "vuelta" : "serie"
  // Verdad derivada, no estado: editar > descansar > cargar > completado.
  const phase = editing
    ? "edit"
    : timer.active
      ? "rest"
      : cursor
        ? "input"
        : "done"

  const activeItem = cursor?.member ?? slot.items[0]
  const ex = activeItem.ex
  const prevSet = cursor
    ? HISTORY[activeItem.ex.name]?.lastWeek[cursor.setIdx]
    : undefined
  const nextSlot = slotIdx + 1 < SLOTS.length ? SLOTS[slotIdx + 1] : null
  const prevSlot = slotIdx > 0 ? SLOTS[slotIdx - 1] : null

  const canSubmit =
    toNum(draft.weight) != null && (toNum(draft.reps) ?? 0) > 0

  // ── acciones ──────────────────────────────────────────────────────────────

  const setField = (field: keyof DraftInputs, value: string) => {
    const ok =
      field === "weight" ? /^\d*([.,]\d*)?$/.test(value) : /^\d*$/.test(value)
    if (ok) setDraft((d) => ({ ...d, [field]: value }))
  }

  const applyEntry = (
    name: string,
    setIdx: number,
    entry: SetEntry
  ): SessionLogs => {
    const next = {
      ...logs,
      [name]: logs[name].map((e, i) => (i === setIdx ? entry : e)),
    }
    setLogs(next)
    return next
  }

  const completeActive = () => {
    if (!cursor || !canSubmit) return
    const next = applyEntry(cursor.member.ex.name, cursor.setIdx, {
      weight: toNum(draft.weight),
      reps: toNum(draft.reps),
      rir: toNum(draft.rir),
      status: "done",
    })
    const after = cursorOf(slot, next)
    if (after) setDraft(prefillDraft(after.member.ex.name, after.setIdx, next))
    // Misma vuelta abierta (biserie, sigue el otro miembro): sin pausa.
    if (after && after.setIdx === cursor.setIdx) return
    // Vuelta/serie cerrada — también tras la última (descanso pre-siguiente).
    timer.start(parseRest(slot.items[0].ex.rest))
  }

  const skipActive = () => {
    if (!cursor) return
    const next = applyEntry(cursor.member.ex.name, cursor.setIdx, {
      status: "skipped",
    })
    setDraft(draftFor(slot, next))
  }

  const startEdit = (name: string, setIdx: number) => {
    const e = logs[name]?.[setIdx]
    setEditing({ name, setIdx })
    setDraft({
      weight: e?.weight != null ? String(e.weight) : "",
      reps: e?.reps != null ? String(e.reps) : "",
      rir: e?.rir != null ? String(e.rir) : "",
    })
  }

  const saveEdit = () => {
    if (!editing || !canSubmit) return
    const next = applyEntry(editing.name, editing.setIdx, {
      weight: toNum(draft.weight),
      reps: toNum(draft.reps),
      rir: toNum(draft.rir),
      status: "done",
    })
    setEditing(null)
    setDraft(draftFor(slot, next))
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft(draftFor(slot, logs))
  }

  const clearEntry = (name: string, setIdx: number) => {
    const next = applyEntry(name, setIdx, { status: "pending" })
    if (timer.active) timer.skip()
    if (editing?.name === name && editing.setIdx === setIdx) setEditing(null)
    setDraft(draftFor(slot, next))
  }

  /** Vacía la vuelta entera de una biserie (todos los miembros). */
  const clearRound = (v: number) => {
    let next = logs
    for (const it of slot.items) {
      next = {
        ...next,
        [it.ex.name]: next[it.ex.name].map((e, i) =>
          i === v ? { status: "pending" as const } : e
        ),
      }
    }
    setLogs(next)
    if (timer.active) timer.skip()
    setEditing(null)
    setDraft(draftFor(slot, next))
  }

  const resetExercise = () => {
    let next = logs
    for (const it of slot.items) {
      next = {
        ...next,
        [it.ex.name]: Array.from({ length: it.ex.sets }, () => ({
          status: "pending" as const,
        })),
      }
    }
    setLogs(next)
    timer.skip()
    setEditing(null)
    setDraft(draftFor(slot, next))
  }

  const goToSlot = (i: number) => {
    const target = i >= 0 && i < SLOTS.length ? SLOTS[i] : null
    if (!target) return
    setSlotIdx(i)
    timer.skip()
    setEditing(null)
    setDraft(draftFor(target, logs))
  }

  // ── etiquetas derivadas para el bloque activo ─────────────────────────────

  const followUp = cursor
    ? `luego ${unit} ${cursor.setIdx + 1} de ${ex.sets}${
        isSuper ? ` — ${cursor.member.letter}` : ""
      }`
    : "ejercicio completado"

  const editingItem = editing
    ? slot.items.find((it) => it.ex.name === editing.name)
    : undefined
  const editingLetter = isSuper ? editingItem?.letter : undefined
  /** Ejercicio cuyos objetivos muestra el formulario (editado o activo). */
  const formEx = editingItem?.ex ?? ex

  const weightHint =
    prevSet != null && draft.weight === String(prevSet.weight)
      ? "= sem. ant."
      : undefined

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-5 pb-10">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Link
          href="/rutina"
          className="inline-flex items-center gap-1.5 font-label text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Rutina
        </Link>
        <p className="font-label text-xs font-medium tracking-[0.12em] text-primary uppercase">
          Día {String(DAY.order).padStart(2, "0")} — {DAY.name}
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">
          {slot.num}/{String(SLOTS.length).padStart(2, "0")}
        </span>
      </div>

      {/* Índice de ejercicios: clic para saltar */}
      <div className="fade-up flex items-baseline gap-5 border-b border-border py-3.5 font-mono text-[13px] leading-none">
        {SLOTS.map((s, i) => {
          const st = slotState(s, logs)
          const current = i === slotIdx
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => goToSlot(i)}
              aria-label={`Ir a ${s.num} ${slotTitle(s)}`}
              aria-current={current ? "step" : undefined}
              className={cn(
                "cursor-pointer pb-0.5 transition-colors",
                current &&
                  "text-foreground underline decoration-primary decoration-2 underline-offset-4",
                !current && st === "done" && "text-primary",
                !current && st === "in-progress" && "text-ember",
                !current &&
                  st === "pending" &&
                  "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {s.num}
            </button>
          )
        })}
      </div>

      {/* Título */}
      <div key={`title-${slot.num}`} className="fade-up py-6 [--delay:60ms]">
        <p className="font-label text-xs font-medium tracking-[0.18em] text-primary uppercase">
          Ejercicio {slot.num}
          {isSuper &&
            ` · ${slot.items.length === 2 ? "biserie" : "superserie"}`}
        </p>

        {isSuper ? (
          <div className="mt-2 space-y-1.5">
            {slot.items.map((it) => {
              const isActive = it.ex.name === ex.name
              return (
                <h1
                  key={it.ex.name}
                  className={cn(
                    "font-display text-3xl leading-[0.95] uppercase transition-colors sm:text-4xl",
                    isActive ? "text-foreground" : "text-muted-foreground/60"
                  )}
                >
                  <span
                    className={cn(
                      "mr-2 text-[0.6em]",
                      isActive ? "text-primary" : "text-primary/60"
                    )}
                  >
                    {it.letter}
                  </span>
                  {it.ex.name}
                </h1>
              )
            })}
          </div>
        ) : (
          <h1 className="mt-2 font-display text-4xl leading-[0.95] uppercase sm:text-5xl">
            {ex.name}
          </h1>
        )}

        <p className="mt-3 font-mono text-[13px] text-muted-foreground">
          {isSuper ? (
            <>
              {ex.sets} vueltas ·{" "}
              {slot.items
                .map((it) => `${it.letter} ${sheet(it.ex.reps)}`)
                .join(" · ")}{" "}
              · RIR {sheet(ex.effort)} · desc {sheet(ex.rest)} por vuelta
            </>
          ) : (
            <>
              {ex.sets} × {sheet(ex.reps)} · RIR {sheet(ex.effort)} · desc{" "}
              {sheet(ex.rest)}
            </>
          )}
        </p>
      </div>

      {/* Bloque activo: input / edición / descanso / completado */}
      <div className="fade-up border-y border-border py-6 [--delay:120ms]">
        {phase === "rest" && (
          <RestPanel
            timer={timer}
            followUp={followUp}
            onStartNext={
              cursor
                ? `Empezar ${unit} ${cursor.setIdx + 1}${
                    isSuper ? ` — ${cursor.member.letter}` : ""
                  }`
                : undefined
            }
          >
            {!cursor && nextSlot && (
              <div className="mt-6 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => goToSlot(slotIdx + 1)}
                  className={cn(
                    labelBtn,
                    "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Siguiente: {nextSlot.num} {slotTitle(nextSlot)}
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </RestPanel>
        )}

        {(phase === "input" || phase === "edit") && (
          <>
            <div className="flex items-baseline justify-between">
              <p className="font-label text-xs font-medium tracking-[0.12em] text-ember uppercase">
                <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-ember align-middle" />
                {phase === "edit" ? (
                  <>
                    Editando {isSuper ? "vuelta" : "serie"}{" "}
                    {editing!.setIdx + 1}
                    {editingLetter && ` — ${editingLetter}`}
                  </>
                ) : (
                  <>
                    {unit} {cursor!.setIdx + 1} de {ex.sets}
                    {isSuper && ` — ${cursor!.member.letter}`}
                  </>
                )}
              </p>
              {prevSet && phase === "input" && (
                <p className="font-mono text-[11px] text-muted-foreground">
                  sem. ant.:{" "}
                  <span className="text-foreground/80">
                    {prevSet.weight} kg × {prevSet.reps}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-6">
              <PaperInput
                label="Peso"
                value={draft.weight}
                onChange={(v) => setField("weight", v)}
                suffix="kg"
                inputMode="decimal"
                hint={phase === "input" ? weightHint : undefined}
              />
              <PaperInput
                label="Reps"
                value={draft.reps}
                onChange={(v) => setField("reps", v)}
                inputMode="numeric"
                hint={`obj. ${sheet(formEx.reps)}`}
              />
              <PaperInput
                label="RIR"
                value={draft.rir}
                onChange={(v) => setField("rir", v)}
                inputMode="numeric"
                hint={`obj. ${sheet(formEx.effort)}`}
              />
            </div>

            <div className="mt-5 flex items-center gap-4">
              <Button
                onClick={phase === "edit" ? saveEdit : completeActive}
                disabled={!canSubmit}
                className="h-11 flex-1 font-label text-xs font-medium tracking-[0.12em] uppercase shadow-[0_0_16px_-4px] shadow-primary/50"
              >
                <Check className="size-4" />
                {phase === "edit"
                  ? "Guardar cambios"
                  : isSuper
                    ? `Completar ${cursor!.member.letter}`
                    : `Completar ${unit}`}
              </Button>
              <button
                type="button"
                onClick={phase === "edit" ? cancelEdit : skipActive}
                className={cn(
                  labelBtn,
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                {phase === "edit" ? "cancelar" : "omitir"}
              </button>
            </div>

            {phase === "input" && (
              <p className="mt-4 text-center font-mono text-[10px] tracking-[0.08em] text-muted-foreground/60">
                {isSuper && cursor!.memberIdx < slot.items.length - 1 ? (
                  <>
                    → sigue{" "}
                    {slot.items[cursor!.memberIdx + 1].letter}, sin pausa ·
                    descanso {sheet(slot.items[0].ex.rest)} al cerrar la vuelta
                  </>
                ) : isSuper ? (
                  <>
                    al completar cierra la vuelta y arranca el descanso de{" "}
                    {sheet(slot.items[0].ex.rest)}
                  </>
                ) : (
                  <>al completar arranca el descanso de {sheet(ex.rest)}</>
                )}
              </p>
            )}
          </>
        )}

        {phase === "done" && (
          <div className="fade-up py-2 text-center">
            <p className="font-label text-xs font-medium tracking-[0.12em] text-primary uppercase">
              <Check className="mr-1.5 inline size-3.5 align-[-2px]" />
              Ejercicio completado
            </p>
            {nextSlot ? (
              <Button
                onClick={() => goToSlot(slotIdx + 1)}
                className="mt-5 h-11 px-6 font-label text-xs font-medium tracking-[0.12em] uppercase shadow-[0_0_16px_-4px] shadow-primary/50"
              >
                Siguiente: {nextSlot.num} {slotTitle(nextSlot)}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                <p className="mt-3 font-display text-3xl uppercase">
                  Día completado
                </p>
                <Button
                  asChild
                  className="mt-5 h-11 px-6 font-label text-xs font-medium tracking-[0.12em] uppercase shadow-[0_0_16px_-4px] shadow-primary/50"
                >
                  <Link href="/rutina">Volver a la rutina</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div
        key={`ledger-${slot.num}`}
        className="fade-up border-b border-border py-6 [--delay:180ms]"
      >
        <p className="font-label text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {isSuper ? "Vueltas" : "Series"}
        </p>
        <ul className="mt-3 space-y-2.5">
          {isSuper
            ? Array.from({ length: ex.sets }, (_, v) => {
                const entries = slot.items.map((it) => logs[it.ex.name][v])
                const anyLogged = entries.some((e) => e?.status !== "pending")
                const st: SetEntry["status"] = entries.every(
                  (e) => e?.status === "done"
                )
                  ? "done"
                  : entries.every((e) => e?.status === "skipped")
                    ? "skipped"
                    : "pending"
                return (
                  <LedgerLine
                    key={v}
                    tag={`V${v + 1}`}
                    status={st}
                    onClear={anyLogged ? () => clearRound(v) : undefined}
                  >
                    {anyLogged ? (
                      <span className="space-x-3">
                        {slot.items.map((it, mi) => (
                          <span key={it.ex.name}>
                            <span className="mr-1 text-primary/80">
                              {it.letter}
                            </span>
                            <SetRecord
                              s={entries[mi]}
                              prev={HISTORY[it.ex.name]?.lastWeek[v]}
                            />
                            {entries[mi]?.status !== "pending" && (
                              <button
                                type="button"
                                onClick={() => startEdit(it.ex.name, v)}
                                aria-label={`Editar ${it.letter} vuelta ${v + 1}`}
                                className="ml-1.5 cursor-pointer align-middle text-muted-foreground/60 transition-colors hover:text-foreground"
                              >
                                <Pencil className="inline size-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">
                        sin registrar
                      </span>
                    )}
                  </LedgerLine>
                )
              })
            : logs[ex.name].map((s, i) => (
                <LedgerLine
                  key={i}
                  tag={`S${i + 1}`}
                  status={s.status}
                  onEdit={
                    s.status !== "pending"
                      ? () => startEdit(ex.name, i)
                      : undefined
                  }
                  onClear={
                    s.status !== "pending"
                      ? () => clearEntry(ex.name, i)
                      : undefined
                  }
                >
                  <SetRecord s={s} prev={HISTORY[ex.name]?.lastWeek[i]} />
                </LedgerLine>
              ))}
        </ul>
      </div>

      {/* Progresión */}
      <div
        key={`rail-${slot.num}`}
        className="fade-up border-b border-border py-6 [--delay:240ms]"
      >
        <ProgressionRail name={ex.name} todayLogs={logs[ex.name]} />
      </div>

      {/* Navegación + reset */}
      <div className="fade-up pt-6 [--delay:300ms]">
        <div className="flex items-center justify-between gap-4 font-label text-xs font-medium tracking-[0.12em] uppercase">
          {prevSlot ? (
            <button
              type="button"
              onClick={() => goToSlot(slotIdx - 1)}
              className="group inline-flex min-w-0 cursor-pointer items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="truncate">
                {prevSlot.num} {slotTitle(prevSlot)}
              </span>
              {slotState(prevSlot, logs) === "done" && (
                <span className="shrink-0 text-primary">✓</span>
              )}
            </button>
          ) : (
            <span />
          )}
          {nextSlot ? (
            <button
              type="button"
              onClick={() => goToSlot(slotIdx + 1)}
              className="group inline-flex min-w-0 cursor-pointer items-center gap-2 text-right text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="truncate">
                {nextSlot.num} {slotTitle(nextSlot)}
              </span>
              <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <span />
          )}
        </div>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={resetExercise}
            className="inline-flex cursor-pointer items-center gap-1.5 font-label text-[11px] font-medium tracking-[0.12em] text-muted-foreground/60 uppercase transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Reiniciar ejercicio
          </button>
        </div>
      </div>
    </main>
  )
}

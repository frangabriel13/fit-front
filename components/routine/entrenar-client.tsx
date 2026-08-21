"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  Timer,
  X,
} from "lucide-react"

import {
  e1rm,
  exerciseState,
  HISTORY,
  MACROCYCLE,
  ROUTINE,
  SESSION,
  topE1RM,
  WORKOUT_POSITION,
  type ExerciseState,
  type HistSet,
  type SetEntry,
  type SetStatus,
} from "@/lib/routine-data"
import {
  ProgressionRail,
  sheet,
  toSheetItems,
  type SheetItem,
} from "@/components/routine/sheet-bits"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Pantalla de entrenamiento INTERACTIVA con estado local (sin backend), en el
// esquema "tablero": la comparación contra la semana anterior vive siempre a la
// vista, el 1RM estimado se recalcula mientras cargás, y un único stepper apunta
// a la celda que tocaste (peso o reps) para dejar lugar a números grandes.
// Código de color "monocromo filo": el CYAN (--primary) es el único que
// colorea, y marca DÓNDE ESTÁS AHORA — la celda que cargás, el RIR elegido, la
// serie en curso, el botón. Lo hecho baja a neutro (--done / --muted-foreground)
// y el ámbar no se usa acá.
// La regla es que ningún estado se apoya en la opacidad: un tinte al 5% sobre
// este fondo no se lee como estado, se lee como mancha. El estado lo hacen el
// RELLENO (donde estás cargando) y el BORDE (lo que acompaña), sobre la escala
// opaca de globals.css: surface / surface-raised / hairline / edge / faint.
// Todo vive en memoria — al recargar se pierde. La persistencia llega al
// cablear a la API (como use-sessions en /splits). Deriva el plan de ROUTINE +
// WORKOUT_POSITION; cambiá WORKOUT_POSITION.exerciseName para previsualizar la
// variante biserie.

// ─── helpers de datos ────────────────────────────────────────────────────────

interface Slot {
  num: string
  items: SheetItem[]
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

function slotState(slot: Slot): ExerciseState {
  const states = slot.items.map((it) => exerciseState(SESSION.logs[it.ex.name]))
  if (states.every((s) => s === "done")) return "done"
  if (states.some((s) => s !== "pending")) return "in-progress"
  return "pending"
}

function slotTitle(slot: Slot): string {
  return slot.items.length > 1
    ? slot.items.map((it) => it.ex.name).join(" + ")
    : slot.items[0].ex.name
}

/** "4'" → 240, "90''" → 90. Descanso a segundos. */
function restToSeconds(rest: string): number {
  const n = parseInt(rest.replace(/\D/g, ""), 10)
  if (Number.isNaN(n)) return 0
  return rest.includes("''") ? n : n * 60
}

/** Segundos → "M:SS". */
function fmtClock(total: number): string {
  const t = Math.max(0, total)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`
}

const round2 = (n: number) => Math.round(n * 100) / 100

// El borrador guarda strings (no números) para que tipear decimales sea natural
// —"57.", "1,25"— sin que el input normalice mientras escribís. Se parsea recién
// al sumar con los botones o al completar la serie.
interface Draft {
  weight: string
  reps: string
  rir: string
}

/** Qué celda recibe los ± del stepper compartido. */
type Field = "weight" | "reps"

const numStr = (n: number | null | undefined) => (n == null ? "" : String(n))

const parseNum = (s: string): number | null => {
  if (s.trim() === "") return null
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Sanea entrada decimal: dígitos + una sola coma/punto. */
const sanitizeDecimal = (raw: string): string => {
  const s = raw.replace(",", ".").replace(/[^0-9.]/g, "")
  const i = s.indexOf(".")
  return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "")
}

/** Sanea entrada entera: solo dígitos. */
const sanitizeInt = (raw: string): string => raw.replace(/[^0-9]/g, "")

const STEPS: Record<Field, number[]> = {
  weight: [0.5, 1, 2.5],
  reps: [1, 2, 5],
}

// ─── piezas visuales ─────────────────────────────────────────────────────────

/**
 * Celda grande y tipeable. Tocarla la vuelve el blanco del stepper compartido;
 * el número sigue siendo un <input> (tocás y escribís, foco selecciona todo)
 * para que cargar 82.5 no cueste quince toques. La enfocada se RELLENA con el
 * acento y el número se invierte: se ve de reojo, con el celular en el piso.
 */
function ValueTile({
  label,
  value,
  active,
  inputMode,
  onInput,
  onFocus,
}: {
  label: ReactNode
  value: string
  active: boolean
  inputMode: "decimal" | "numeric"
  onInput: (raw: string) => void
  onFocus: () => void
}) {
  return (
    <div
      onClick={onFocus}
      className={cn(
        "rounded-2xl border px-4 pt-3 pb-3.5 transition-colors",
        active ? "border-primary bg-primary" : "border-hairline bg-surface"
      )}
    >
      <p
        className={cn(
          "font-mono text-[9px] font-semibold tracking-[0.2em] uppercase transition-colors",
          active ? "text-on-primary-soft" : "text-faint"
        )}
      >
        <span className="block truncate">{label}</span>
      </p>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder="—"
        onChange={(e) => onInput(e.target.value)}
        onFocus={(e) => {
          onFocus()
          e.target.select()
        }}
        className={cn(
          "mt-1 w-full min-w-0 bg-transparent font-display text-[clamp(36px,11.8cqi,46px)] leading-none tracking-tight tabular-nums outline-none",
          active
            ? "text-primary-foreground caret-primary-foreground placeholder:text-on-primary-soft"
            : "text-foreground caret-primary placeholder:text-faint"
        )}
      />
    </div>
  )
}

/** Stepper único: [− · pasos · +]. Los pasos dependen de la celda enfocada. */
function StepBar({
  field,
  step,
  onStep,
  onInc,
  onDec,
  canDec,
}: {
  field: Field
  step: number
  onStep: (v: number) => void
  onInc: () => void
  onDec: () => void
  canDec: boolean
}) {
  return (
    <>
      <div className="mt-2.5 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2.5">
        <button
          type="button"
          aria-label={field === "weight" ? "Bajar peso" : "Bajar repeticiones"}
          onClick={onDec}
          disabled={!canDec}
          className="flex h-14 items-center justify-center rounded-2xl border border-edge bg-surface text-muted-foreground transition-colors enabled:cursor-pointer enabled:hover:border-primary enabled:hover:text-foreground disabled:opacity-35"
        >
          <Minus className="size-5" />
        </button>

        <div className="grid grid-cols-3 gap-1.5">
          {STEPS[field].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onStep(v)}
              aria-pressed={step === v}
              className={cn(
                "flex h-14 cursor-pointer items-center justify-center rounded-xl border font-mono text-xs font-semibold tabular-nums transition-colors",
                step === v
                  ? "border-primary bg-surface-raised text-foreground"
                  : "border-hairline bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              ± {v}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label={field === "weight" ? "Subir peso" : "Subir repeticiones"}
          onClick={onInc}
          className="flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-primary bg-surface-raised text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-5" />
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[9px] tracking-[0.16em] text-faint uppercase">
        el control ajusta {field === "weight" ? "el peso" : "las repeticiones"}
      </p>
    </>
  )
}

/** RIR como fila de pastillas: la elegida se rellena, el resto queda plano. */
const RIR_WORDS = ["al fallo", "casi al fallo", "exigente", "cómoda", "sobra"]

function RirScale({
  value,
  onPick,
}: {
  value: number | null
  onPick: (n: number) => void
}) {
  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[9px] font-semibold tracking-[0.2em] text-faint uppercase">
          RIR
        </span>
        <span className="font-mono text-[9px] tracking-[0.06em] text-primary uppercase">
          {value != null ? RIR_WORDS[value] : "sin marcar"}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-5 gap-1.5">
        {[0, 1, 2, 3, 4].map((n) => {
          const on = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              aria-pressed={on}
              className={cn(
                "flex h-12 cursor-pointer items-center justify-center rounded-xl border font-mono text-[15px] tabular-nums transition-colors",
                on
                  ? "border-primary bg-primary font-bold text-primary-foreground"
                  : "border-hairline bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Temporizador de descanso con cuenta regresiva. Se monta al entrar al descanso
 * y arranca solo desde la duración del ejercicio; `−15s` resta, `seguir` corta,
 * y al llegar a 0 avisa con onDone. Compacto: vive en el pie fijo.
 */
function RestTimer({
  rest,
  onSkip,
  onDone,
}: {
  rest: string
  onSkip: () => void
  onDone: () => void
}) {
  const total = restToSeconds(rest)
  const [left, setLeft] = useState(total)

  // Un solo intervalo mientras está montado; el functional update evita relanzarlo.
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // Al llegar a 0, cerrar el descanso (desmonta el timer).
  useEffect(() => {
    if (left === 0) onDone()
  }, [left, onDone])

  const pct = total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0

  return (
    <div className="fade-up overflow-hidden rounded-2xl border border-edge bg-surface">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="text-primary">
          <Timer className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-semibold tracking-[0.2em] text-primary uppercase">
            Descanso
          </p>
          <p className="font-display text-[22px] leading-none tabular-nums text-foreground">
            {fmtClock(left)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLeft((s) => Math.max(0, s - 15))}
          className="h-11 shrink-0 cursor-pointer rounded-full border border-edge px-3 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:border-primary hover:text-foreground"
        >
          −15s
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="h-11 shrink-0 cursor-pointer rounded-full border border-primary bg-surface-raised px-3.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-primary uppercase transition-colors hover:bg-accent"
        >
          Seguir
        </button>
      </div>
      {/* Barra que drena con el tiempo */}
      <div className="h-1 w-full bg-hairline">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Registro de una serie dentro de una celda de la matriz. */
function SetRecord({ s }: { s: SetEntry }) {
  if (s.status === "done")
    return (
      <span className="text-foreground">
        {s.weight}
        <span className="text-faint"> × </span>
        {s.reps}
      </span>
    )
  if (s.status === "skipped")
    return (
      <span className="text-faint italic line-through decoration-faint">
        omitida
      </span>
    )
  return <span className="text-faint">—</span>
}

/** Encabezado plegable: <details> nativo con chevron que rota al abrir. */
function Disclosure({
  eyebrow,
  meta,
  children,
  delay,
}: {
  eyebrow: string
  meta?: ReactNode
  children: ReactNode
  delay: string
}) {
  return (
    <details
      className="group fade-up border-t border-hairline"
      style={{ "--delay": delay } as CSSProperties}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {eyebrow}
          </span>
          {meta}
        </span>
        <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  )
}

// ─── pantalla ──────────────────────────────────────────────────────────────────

export function EntrenarClient() {
  const day =
    ROUTINE.days.find((d) => d.id === WORKOUT_POSITION.dayId) ?? ROUTINE.days[0]
  const slots = toSlots(toSheetItems(day.exercises))
  const slotIdx = Math.max(
    slots.findIndex((s) =>
      s.items.some((it) => it.ex.name === WORKOUT_POSITION.exerciseName)
    ),
    0
  )
  const slot = slots[slotIdx]
  const members = slot.items
  const isSuper = members.length > 1
  const rounds = members[0].ex.sets
  const unit = isSuper ? "vuelta" : "serie"

  const prevSlot = slots[slotIdx - 1]
  const nextSlot = slots[slotIdx + 1]

  // ── estado local: registro por miembro (A/B…) × ronda, sembrado del mock ──
  const [memberLogs, setMemberLogs] = useState<SetEntry[][]>(() =>
    members.map((it) =>
      Array.from({ length: it.ex.sets }, (_, i) => ({
        ...(SESSION.logs[it.ex.name]?.[i] ?? { status: "pending" as const }),
      }))
    )
  )

  // Cursor sobre (ronda, miembro): la unidad que se está cargando ahora.
  // En biserie el orden es A1 → B1 → A2 → B2…; en serie simple solo avanza ronda.
  function firstPending(logs: SetEntry[][]): { round: number; member: number } {
    for (let r = 0; r < rounds; r++)
      for (let m = 0; m < members.length; m++)
        if (logs[m][r]?.status === "pending") return { round: r, member: m }
    return { round: rounds - 1, member: members.length - 1 }
  }

  // Valores de arranque del borrador: si la unidad ya está hecha, sus propios
  // valores; si está pendiente, la última serie hecha del miembro (overload);
  // si no hay nada esta sesión, el peso de la semana pasada (HISTORY).
  function prefill(logs: SetEntry[][], member: number, round: number): Draft {
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
        return {
          weight: numStr(e.weight),
          reps: numStr(e.reps),
          rir: numStr(e.rir),
        }
    }
    const lastWeek = HISTORY[members[member].ex.name]?.weeks.at(-1)
    const ref = lastWeek?.[round] ?? lastWeek?.[0]
    return { weight: numStr(ref?.weight), reps: "", rir: "" }
  }

  const [cursor, setCursor] = useState(() => firstPending(memberLogs))
  const [draft, setDraft] = useState<Draft>(() =>
    prefill(memberLogs, cursor.member, cursor.round)
  )
  // Celda enfocada + paso elegido para cada una: el stepper es uno solo.
  const [field, setField] = useState<Field>("weight")
  const [steps, setSteps] = useState<Record<Field, number>>({
    weight: 2.5,
    reps: 1,
  })
  // Descanso: aparece recién al completar una serie / cerrar una vuelta.
  const [resting, setResting] = useState(false)

  const activeMember = members[cursor.member]
  const ex = activeMember.ex

  // Estado por ronda (vuelta o serie) para el dial y la matriz.
  const unitStatuses: SetStatus[] = Array.from({ length: rounds }, (_, r) => {
    const entries = members.map((_, m) => memberLogs[m][r])
    if (entries.every((e) => e.status === "done")) return "done"
    if (entries.every((e) => e.status === "skipped")) return "skipped"
    return "pending"
  })
  const allClosed = unitStatuses.every((s) => s !== "pending")

  const currentSlotState: ExerciseState = unitStatuses.every((s) => s === "done")
    ? "done"
    : unitStatuses.some((s) => s !== "pending")
      ? "in-progress"
      : "pending"

  // ── referencia de la semana anterior (comparación siempre a la vista) ──
  const lastWeek: HistSet[] | undefined = HISTORY[ex.name]?.weeks.at(-1)
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

  // ── transiciones ──────────────────────────────────────────────────────────

  function advance(c: { round: number; member: number }) {
    let m = c.member + 1
    let r = c.round
    if (m >= members.length) {
      m = 0
      r += 1
    }
    return r >= rounds ? c : { round: r, member: m }
  }

  function writeAndMove(entry: SetEntry) {
    const next = memberLogs.map((arr) => arr.slice())
    next[cursor.member][cursor.round] = entry
    const nc = advance(cursor)
    setMemberLogs(next)
    setCursor(nc)
    setDraft(prefill(next, nc.member, nc.round))
    setField("weight")
  }

  const completeUnit = () => {
    // En biserie el descanso es al cerrar la vuelta (tras la última estación);
    // en serie simple, siempre.
    const closesRound = cursor.member === members.length - 1
    writeAndMove({
      status: "done",
      weight: draftWeight ?? undefined,
      reps: draftReps ?? undefined,
      rir: draftRir ?? undefined,
    })
    setResting(closesRound)
  }

  const skipUnit = () => {
    writeAndMove({ status: "skipped" })
    setResting(false)
  }

  /** Volver a una ronda ya registrada para corregirla. */
  function goToRound(round: number) {
    setCursor({ round, member: 0 })
    setDraft(prefill(memberLogs, 0, round))
    setField("weight")
    setResting(false)
  }

  // Reset/omitir desde la matriz operan a nivel ronda (en biserie, A y B juntas).
  function resetRound(round: number) {
    const next = memberLogs.map((arr) => arr.slice())
    members.forEach((_, m) => (next[m][round] = { status: "pending" }))
    setMemberLogs(next)
    setCursor({ round, member: 0 })
    setDraft(prefill(next, 0, round))
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
    setDraft(prefill(cleared, 0, 0))
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

  const canDec =
    field === "weight"
      ? (draftWeight ?? 0) > 0
      : (draftReps ?? 0) > 0
  const canComplete = draftWeight != null && draftReps != null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 [container-type:inline-size]">
      {/* Barra superior — sticky para conservar contexto al hacer scroll */}
      <div className="sticky top-0 z-20 -mx-5 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-hairline bg-background px-5">
        <Link
          href="/rutina"
          aria-label="Volver a la rutina"
          className="-ml-1.5 inline-flex size-9 items-center justify-center justify-self-start rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-[18px]" />
        </Link>
        <p className="justify-self-center font-mono text-[11px] font-semibold tracking-[0.22em] whitespace-nowrap text-muted-foreground uppercase">
          Día {String(day.order).padStart(2, "0")} — {day.name}
        </p>
        <span className="justify-self-end font-mono text-[11px] tabular-nums text-faint">
          {slot.num}/{String(slots.length).padStart(2, "0")}
        </span>
      </div>

      {/* Progreso de la sesión — un segmento por ejercicio del día */}
      <div className="fade-up flex items-center gap-1.5 py-3">
        {slots.map((s, i) => {
          const st = i === slotIdx ? currentSlotState : slotState(s)
          const current = i === slotIdx
          return (
            <span
              key={s.num}
              aria-hidden
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                current
                  ? "h-2 bg-primary"
                  : st === "done"
                    ? "bg-done"
                    : st === "in-progress"
                      ? "bg-edge"
                      : "bg-hairline"
              )}
            />
          )
        })}
      </div>

      {/* Cabecera: identidad del ejercicio. Sin dial — el título se queda con
          el ancho completo y el avance ya lo cuenta la matriz de más abajo. */}
      <div className="fade-up pb-3.5 [--delay:40ms]">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold tracking-[0.26em] text-primary uppercase">
            Ejercicio {slot.num}
            {isSuper && ` · ${members.length === 2 ? "biserie" : "superserie"}`}
          </p>

          {isSuper ? (
            <div className="mt-2 space-y-0.5">
              {members.map((it, mi) => {
                const isActive = mi === cursor.member
                return (
                  <h1
                    key={it.ex.name}
                    className={cn(
                      "font-display text-[clamp(19px,6.2cqi,25px)] leading-[1.05] uppercase",
                      isActive ? "text-foreground" : "text-faint"
                    )}
                  >
                    <span
                      className={cn(
                        "mr-1.5 text-[0.7em]",
                        isActive ? "text-primary" : "text-faint"
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
            <h1 className="mt-2 font-display text-[clamp(26px,9.4cqi,38px)] leading-[0.95] uppercase">
              {ex.name}
            </h1>
          )}

          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            {rounds} {isSuper ? "vueltas" : "×"} {sheet(ex.reps)} · RIR{" "}
            {sheet(ex.effort)} · desc {sheet(ex.rest)}
          </p>
        </div>

      </div>

      {/* Referencia: la semana anterior y lo de hoy en una sola tarjeta —
          la columna izquierda ES el botón para igualar lo de la semana pasada. */}
      <section
        className={cn(
          "fade-up items-stretch gap-3 [--delay:80ms]",
          refSet && "grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]"
        )}
      >
        {refSet && (
          <>
            <button
              type="button"
              aria-label="Igualar la semana anterior"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  weight: String(refSet.weight),
                  reps: String(refSet.reps),
                }))
              }
              className="flex cursor-pointer flex-col gap-1 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-left transition-colors hover:border-edge"
            >
              <span className="font-mono text-[9px] tracking-[0.18em] text-faint uppercase">
                Semana {MACROCYCLE.week - 1}
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {refSet.weight} kg × {refSet.reps}
              </span>
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[9px] tabular-nums text-faint">
                  1RM {refE1rm}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-primary uppercase">
                  <ArrowRight className="size-2.5" strokeWidth={2.5} />
                  igualar
                </span>
              </span>
            </button>

            <span aria-hidden className="bg-hairline" />
          </>
        )}

        <div className="flex flex-col gap-1 py-2.5">
          <span
            className="font-mono text-[9px] font-semibold tracking-[0.18em] text-primary uppercase"
          >
            Hoy · {unit} {cursor.round + 1}/{rounds}
            {isSuper && ` — ${activeMember.letter}`}
          </span>
          <span className="font-mono text-sm tabular-nums text-foreground">
            {draft.weight || "—"} kg × {draft.reps || "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] tabular-nums text-faint">
              1RM {liveE1rm ?? "—"}
            </span>
            {e1rmDelta != null && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                  e1rmDelta > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-raised text-muted-foreground"
                )}
              >
                {e1rmDelta > 0
                  ? `+${e1rmDelta}`
                  : e1rmDelta === 0
                    ? "="
                    : e1rmDelta}
              </span>
            )}
          </span>
        </div>
      </section>

      {/* Editor: dos celdas grandes + un solo stepper apuntado a la enfocada */}
      <section className="fade-up mt-3 [--delay:120ms]">
        <div className="grid grid-cols-2 gap-2.5">
          <ValueTile
            label="Peso · kg"
            value={draft.weight}
            active={field === "weight"}
            inputMode="decimal"
            onFocus={() => setField("weight")}
            onInput={(raw) =>
              setDraft((d) => ({ ...d, weight: sanitizeDecimal(raw) }))
            }
          />
          <ValueTile
            label={`Reps · meta ${sheet(ex.reps)}`}
            value={draft.reps}
            active={field === "reps"}
            inputMode="numeric"
            onFocus={() => setField("reps")}
            onInput={(raw) =>
              setDraft((d) => ({ ...d, reps: sanitizeInt(raw) }))
            }
          />
        </div>

        <StepBar
          field={field}
          step={steps[field]}
          canDec={canDec}
          onStep={(v) => setSteps((s) => ({ ...s, [field]: v }))}
          onInc={() => bump(1)}
          onDec={() => bump(-1)}
        />

        <RirScale
          value={draftRir}
          onPick={(n) => setDraft((d) => ({ ...d, rir: String(n) }))}
        />
      </section>

      {/* Matriz de series: el registro completo, tocable para corregir.
          Va debajo del pliegue — arriba queda todo el ciclo de carga. */}
      <div className="fade-up mt-6 grid grid-cols-3 gap-2 [--delay:200ms]">
        {unitStatuses.map((st, r) => {
          const current = r === cursor.round
          const entries = members.map((_, m) => memberLogs[m][r])
          return (
            <div
              key={r}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border transition-colors",
                current
                  ? "border-primary bg-surface-raised"
                  : st === "done"
                    ? "border-hairline bg-surface"
                    : st === "skipped"
                      ? "border-hairline bg-surface"
                      : "border-dashed border-hairline bg-surface"
              )}
            >
              <button
                type="button"
                onClick={() => goToRound(r)}
                className="flex min-h-11 cursor-pointer flex-col px-3 py-2.5 text-left"
              >
                <span
                  className={cn(
                    "font-mono text-[9px] font-semibold tracking-[0.16em] uppercase",
                    current
                      ? "text-primary"
                      : st === "done"
                        ? "text-muted-foreground"
                        : "text-faint"
                  )}
                >
                  {isSuper ? "Vuelta" : "Serie"} {r + 1}
                </span>
                <span className="mt-1 block space-y-0.5 font-mono text-[11px] tabular-nums">
                  {members.map((it, mi) => (
                    <span key={it.ex.name} className="block truncate">
                      {isSuper && (
                        <span className="mr-1 text-faint">{it.letter}</span>
                      )}
                      <SetRecord s={entries[mi]} />
                    </span>
                  ))}
                </span>
              </button>

              {/* Acciones a 44px: dos mitades tocables al pie de la celda */}
              {st !== "pending" && (
                <div
                  className={cn(
                    "mt-auto grid border-t border-hairline text-faint",
                    st === "done" ? "grid-cols-2" : "grid-cols-1"
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Resetear ${unit} ${r + 1}`}
                    onClick={() => resetRound(r)}
                    className="inline-flex h-11 cursor-pointer items-center justify-center transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  {st === "done" && (
                    <button
                      type="button"
                      aria-label={`Marcar ${unit} ${r + 1} como no hecha`}
                      onClick={() => omitRound(r)}
                      className="inline-flex h-11 cursor-pointer items-center justify-center border-l border-hairline transition-colors hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progresión del macrociclo — secundaria, plegable */}
      {HISTORY[ex.name] && (
        <div className="mt-5">
          <Disclosure
            eyebrow="Progresión"
            delay="240ms"
            meta={
              <span className="font-mono text-[10px] tracking-[0.06em] text-faint uppercase">
                top set
              </span>
            }
          >
            <ProgressionRail name={ex.name} />
          </Disclosure>
        </div>
      )}

      {/* Navegación entre ejercicios + reset */}
      <div className="fade-up mt-5 border-t border-hairline pt-5 [--delay:280ms]">
        <div className="flex items-center justify-between gap-4 font-mono text-[11px] tracking-[0.14em] uppercase">
          {prevSlot ? (
            <Link
              href="/rutina/entrenar"
              className="group inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="truncate">
                {prevSlot.num} {slotTitle(prevSlot)}
              </span>
              {slotState(prevSlot) === "done" && (
                <span className="shrink-0 text-muted-foreground">✓</span>
              )}
            </Link>
          ) : (
            <span />
          )}
          {nextSlot ? (
            <Link
              href="/rutina/entrenar"
              className="group inline-flex min-w-0 items-center gap-2 text-right text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="truncate">
                {nextSlot.num} {slotTitle(nextSlot)}
              </span>
              <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span />
          )}
        </div>
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={resetExercise}
            className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-faint uppercase transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Reiniciar ejercicio
          </button>
        </div>
      </div>

      {/* Pie fijo: durante el descanso el temporizador ocupa el lugar del CTA */}
      <div className="sticky bottom-0 z-20 -mx-5 mt-auto border-t border-edge bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {resting ? (
          <RestTimer
            rest={ex.rest}
            onSkip={() => setResting(false)}
            onDone={() => setResting(false)}
          />
        ) : allClosed ? (
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="h-14 flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase"
            >
              <Link href="/rutina/entrenar">
                <span className="truncate">
                  {nextSlot
                    ? `Siguiente · ${nextSlot.num} ${slotTitle(nextSlot)}`
                    : "Terminar el día"}
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <button
              type="button"
              aria-label="Reiniciar ejercicio"
              onClick={resetExercise}
              className="inline-flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-edge text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={completeUnit}
              disabled={!canComplete}
              className="h-14 min-w-0 flex-1 text-[12px] font-semibold tracking-[0.16em] uppercase"
            >
              <Check className="size-4" />
              <span className="truncate">Completar {unit}</span>
            </Button>
            <button
              type="button"
              onClick={skipUnit}
              className="h-14 shrink-0 cursor-pointer rounded-lg border border-edge px-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:border-primary hover:text-foreground"
            >
              Omitir
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

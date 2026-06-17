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
  exerciseState,
  HISTORY,
  ROUTINE,
  SESSION,
  WORKOUT_POSITION,
  type ExerciseState,
  type SetEntry,
  type SetStatus,
} from "@/lib/routine-data"
import {
  ProgressionRail,
  SetTally,
  sheet,
  toSheetItems,
  type SheetItem,
} from "@/components/routine/sheet-bits"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Pantalla de entrenamiento INTERACTIVA con estado local (sin backend): los
// steppers de peso/reps/RIR editan un borrador, "Completar" lo asienta en el
// registro de la serie/vuelta y avanza el cursor. Todo vive en memoria — al
// recargar se pierde. La persistencia llega al cablear a la API (como
// use-sessions en /splits). Deriva el plan de ROUTINE + WORKOUT_POSITION;
// cambiá WORKOUT_POSITION.exerciseName para previsualizar la variante biserie.

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

// ─── piezas visuales ─────────────────────────────────────────────────────────

/** Botón redondo de stepper. */
function StepBtn({
  kind,
  label,
  onClick,
  disabled,
}: {
  kind: "minus" | "plus"
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  const Icon = kind === "minus" ? Minus : Plus
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-muted-foreground transition-colors enabled:cursor-pointer disabled:opacity-35",
        kind === "plus"
          ? "enabled:hover:border-primary/50 enabled:hover:text-primary"
          : "enabled:hover:border-white/35 enabled:hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

/**
 * Stepper full-width con celda editable: [− · input centrado · +]. El número es
 * un <input> (tocás y escribís, tipo Excel; foco selecciona todo). Los botones,
 * anclados a los bordes por el grid, suman/restan el paso fino. tabular-nums +
 * subrayado punteado para que se lea como campo y los decimales no descentren.
 */
function Stepper({
  label,
  unit,
  value,
  inputMode,
  canDec,
  onInput,
  onInc,
  onDec,
}: {
  label: string
  unit?: string
  value: string
  inputMode: "decimal" | "numeric"
  canDec: boolean
  onInput: (raw: string) => void
  onInc: () => void
  onDec: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 pt-2.5 pb-3">
      <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
        {label}
        {unit && <span className="text-muted-foreground/40"> · {unit}</span>}
      </p>
      <div className="mt-1.5 grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
        <StepBtn
          kind="minus"
          label={`Bajar ${label}`}
          onClick={onDec}
          disabled={!canDec}
        />
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          placeholder="—"
          onChange={(e) => onInput(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-full min-w-0 border-b border-dashed border-white/15 bg-transparent pb-1 text-center font-display text-[34px] leading-none tracking-tight tabular-nums text-foreground caret-primary outline-none transition-colors placeholder:text-muted-foreground/25 focus:border-primary/60"
        />
        <StepBtn kind="plus" label={`Subir ${label}`} onClick={onInc} />
      </div>
    </div>
  )
}

/**
 * Temporizador de descanso con cuenta regresiva. Se monta al entrar al descanso
 * y arranca solo desde la duración del ejercicio; `−15s` resta, `saltar` corta,
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
    <div className="fade-up overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.07]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
          <Timer className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] tracking-[0.22em] text-primary uppercase">
            Descanso
          </p>
          <p className="font-display text-[28px] leading-none tabular-nums text-foreground">
            {fmtClock(left)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          <button
            type="button"
            onClick={() => setLeft((s) => Math.max(0, s - 15))}
            className="cursor-pointer rounded-full border border-white/15 px-2.5 py-1 transition-colors hover:border-white/35 hover:text-foreground"
          >
            −15s
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="cursor-pointer rounded-full border border-white/15 px-2.5 py-1 transition-colors hover:border-white/35 hover:text-foreground"
          >
            saltar
          </button>
        </div>
      </div>
      {/* Barra que drena con el tiempo */}
      <div className="h-1 w-full bg-primary/10">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Línea del ledger: tally + etiqueta + registro + micro-acciones. */
function LedgerLine({
  tag,
  entry,
  onReset,
  onOmit,
  children,
}: {
  tag: string
  entry: SetStatus
  onReset: () => void
  onOmit: () => void
  children: ReactNode
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground/50">
        {tag}
      </span>
      <SetTally status={entry} />
      <span className="flex-1 font-mono text-[13px]">{children}</span>
      {entry !== "pending" && (
        <span className="flex items-center gap-0.5 text-muted-foreground/40">
          <button
            type="button"
            aria-label={`Resetear ${tag}`}
            onClick={onReset}
            className="cursor-pointer rounded p-1 transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </button>
          {entry === "done" && (
            <button
              type="button"
              aria-label={`Marcar ${tag} como no hecha`}
              onClick={onOmit}
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

function SetRecord({ s }: { s: SetEntry }) {
  if (s.status === "done")
    return (
      <span className="text-foreground/90">
        {s.weight}
        <span className="text-muted-foreground"> kg</span> × {s.reps}
        {s.rir != null && (
          <span className="text-muted-foreground"> · RIR {s.rir}</span>
        )}
      </span>
    )
  if (s.status === "skipped")
    return (
      <span className="text-muted-foreground italic line-through decoration-muted-foreground/40">
        omitida
      </span>
    )
  return <span className="text-muted-foreground/35">sin registrar</span>
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
      className="group fade-up border-t border-white/10"
      style={{ "--delay": delay } as CSSProperties}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {eyebrow}
          </span>
          {meta}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
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
  // Descanso: aparece recién al completar una serie / cerrar una vuelta.
  const [resting, setResting] = useState(false)

  const activeMember = members[cursor.member]
  const ex = activeMember.ex

  // Última serie hecha del miembro activo antes de la ronda actual (referencia).
  const lastDoneActive = (() => {
    for (let r = cursor.round - 1; r >= 0; r--) {
      const e = memberLogs[cursor.member][r]
      if (e.status === "done") return e
    }
    return null
  })()

  // Estado por ronda (vuelta o serie) para tally y resumen.
  const unitStatuses: SetStatus[] = Array.from({ length: rounds }, (_, r) => {
    const entries = members.map((_, m) => memberLogs[m][r])
    if (entries.every((e) => e.status === "done")) return "done"
    if (entries.every((e) => e.status === "skipped")) return "skipped"
    return "pending"
  })
  const doneUnits = unitStatuses.filter((s) => s === "done").length

  const currentSlotState: ExerciseState = unitStatuses.every((s) => s === "done")
    ? "done"
    : unitStatuses.some((s) => s !== "pending")
      ? "in-progress"
      : "pending"

  const hasHistory = Boolean(HISTORY[ex.name])

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
  }

  const completeUnit = () => {
    // En biserie el descanso es al cerrar la vuelta (tras la última estación);
    // en serie simple, siempre.
    const closesRound = cursor.member === members.length - 1
    writeAndMove({
      status: "done",
      weight: parseNum(draft.weight) ?? undefined,
      reps: parseNum(draft.reps) ?? undefined,
      rir: parseNum(draft.rir) ?? undefined,
    })
    setResting(closesRound)
  }

  const skipUnit = () => {
    writeAndMove({ status: "skipped" })
    setResting(false)
  }

  // Reset/omitir desde el ledger operan a nivel ronda (en biserie, A y B juntas).
  function resetRound(round: number) {
    const next = memberLogs.map((arr) => arr.slice())
    members.forEach((_, m) => (next[m][round] = { status: "pending" }))
    setMemberLogs(next)
    setCursor({ round, member: 0 })
    setDraft(prefill(next, 0, round))
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
    setResting(false)
  }

  const canComplete =
    parseNum(draft.weight) != null && parseNum(draft.reps) != null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10">
      {/* Barra superior — sticky para conservar contexto al hacer scroll */}
      <div className="sticky top-0 z-20 -mx-5 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link
          href="/rutina"
          aria-label="Volver a la rutina"
          className="-ml-1.5 inline-flex size-9 items-center justify-center justify-self-start rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-[18px]" />
        </Link>
        <p className="justify-self-center font-mono text-[11px] font-semibold tracking-[0.22em] whitespace-nowrap text-primary uppercase">
          Día {String(day.order).padStart(2, "0")} — {day.name}
        </p>
        <span className="justify-self-end font-mono text-[11px] tabular-nums text-muted-foreground">
          {slot.num}/{String(slots.length).padStart(2, "0")}
        </span>
      </div>

      {/* Progreso de la sesión — un segmento por ejercicio del día */}
      <div className="fade-up flex items-center gap-3 py-4">
        <div className="flex flex-1 items-center gap-1.5">
          {slots.map((s, i) => {
            const st = i === slotIdx ? currentSlotState : slotState(s)
            const current = i === slotIdx
            return (
              <Link
                key={s.num}
                href="/rutina/entrenar"
                aria-label={`Ejercicio ${s.num} — ${slotTitle(s)}`}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  current
                    ? "h-2 bg-primary shadow-[0_0_12px_-2px] shadow-primary/60"
                    : st === "done"
                      ? "bg-primary/70"
                      : st === "in-progress"
                        ? "bg-ember"
                        : "bg-white/10"
                )}
              />
            )
          })}
        </div>
        <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] tabular-nums text-muted-foreground/80 uppercase">
          {slotIdx + 1} de {slots.length}
        </span>
      </div>

      {/* Cabecera del ejercicio */}
      <div className="fade-up pt-1 pb-4 [--delay:40ms]">
        <p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-primary uppercase">
          Ejercicio {slot.num}
          {isSuper && ` · ${members.length === 2 ? "biserie" : "superserie"}`}
        </p>

        {isSuper ? (
          <div className="mt-2 space-y-1">
            {members.map((it, mi) => {
              const isActive = mi === cursor.member
              return (
                <h1
                  key={it.ex.name}
                  className={cn(
                    "font-display text-3xl leading-[0.95] uppercase sm:text-4xl",
                    isActive ? "text-foreground" : "text-muted-foreground/35"
                  )}
                >
                  <span
                    className={cn(
                      "mr-2 text-[0.6em]",
                      isActive ? "text-primary" : "text-primary/40"
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

        <p className="mt-3 font-mono text-[12px] text-muted-foreground">
          {isSuper ? (
            <>
              {rounds} vueltas ·{" "}
              {members
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

      {/* Card-héroe: la serie/vuelta actual (el protagonista) */}
      <section className="fade-up rounded-3xl border border-white/12 bg-card/50 p-5 shadow-[0_8px_40px_-16px] shadow-primary/20 [--delay:80ms]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
            {unit} {cursor.round + 1} de {rounds}
            {isSuper && ` — ${activeMember.letter}`}
          </p>
          {lastDoneActive && (
            <p className="font-mono text-[11px] text-muted-foreground">
              anterior:{" "}
              <span className="text-foreground/80">
                {lastDoneActive.weight} kg × {lastDoneActive.reps}
              </span>
            </p>
          )}
        </div>

        {/* Editor de la serie: peso y reps (celdas editables) + RIR compacto */}
        <div className="mt-4 space-y-2.5">
          <Stepper
            label="Peso"
            unit="kg"
            value={draft.weight}
            inputMode="decimal"
            canDec={(parseNum(draft.weight) ?? 0) > 0}
            onInput={(raw) =>
              setDraft((d) => ({ ...d, weight: sanitizeDecimal(raw) }))
            }
            onInc={() =>
              setDraft((d) => ({
                ...d,
                weight: String(round2((parseNum(d.weight) ?? 0) + 0.5)),
              }))
            }
            onDec={() =>
              setDraft((d) => ({
                ...d,
                weight: String(Math.max(0, round2((parseNum(d.weight) ?? 0) - 0.5))),
              }))
            }
          />
          <Stepper
            label="Reps"
            value={draft.reps}
            inputMode="numeric"
            canDec={(parseNum(draft.reps) ?? 0) > 0}
            onInput={(raw) => setDraft((d) => ({ ...d, reps: sanitizeInt(raw) }))}
            onInc={() =>
              setDraft((d) => ({
                ...d,
                reps: String((parseNum(d.reps) ?? 0) + 1),
              }))
            }
            onDec={() =>
              setDraft((d) => ({
                ...d,
                reps: String(Math.max(0, (parseNum(d.reps) ?? 0) - 1)),
              }))
            }
          />

          {/* RIR — control secundario compacto, editable */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              RIR
            </span>
            <div className="flex items-center gap-2.5">
              <StepBtn
                kind="minus"
                label="Bajar RIR"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    rir: String(Math.max(0, (parseNum(d.rir) ?? 0) - 1)),
                  }))
                }
                disabled={(parseNum(draft.rir) ?? 0) <= 0}
              />
              <input
                type="text"
                inputMode="numeric"
                value={draft.rir}
                placeholder="—"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, rir: sanitizeInt(e.target.value) }))
                }
                onFocus={(e) => e.target.select()}
                className="w-[2.5ch] border-b border-dashed border-white/15 bg-transparent text-center font-display text-2xl leading-none tabular-nums text-foreground caret-primary outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-primary/60"
              />
              <StepBtn
                kind="plus"
                label="Subir RIR"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    rir: String((parseNum(d.rir) ?? 0) + 1),
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Mini-tally de series/vueltas + instrucción contextual */}
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
          <span className="flex items-center gap-1.5">
            {unitStatuses.map((st, i) => (
              <SetTally key={i} status={st} />
            ))}
          </span>
          <span className="font-mono text-[10px] tracking-[0.16em] tabular-nums text-muted-foreground uppercase">
            {isSuper ? "vueltas" : "series"} {doneUnits}/{rounds}
          </span>
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/60">
          {isSuper ? (
            <>
              → seguí{" "}
              {members.find((_, mi) => mi !== cursor.member)?.letter}, sin pausa ·
              descanso {sheet(ex.rest)} al cerrar la vuelta
            </>
          ) : (
            <>al completar arranca el descanso de {sheet(ex.rest)}</>
          )}
        </p>
      </section>

      {/* Secciones secundarias plegables */}
      <div className="mt-5">
        <Disclosure
          eyebrow={isSuper ? "Vueltas" : "Series"}
          delay="160ms"
          meta={
            <>
              <span className="flex items-center gap-1">
                {unitStatuses.map((st, i) => (
                  <SetTally key={i} status={st} />
                ))}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                {doneUnits}/{rounds}
              </span>
            </>
          }
        >
          <ul className="space-y-2.5">
            {isSuper
              ? Array.from({ length: rounds }, (_, v) => {
                  const entries = members.map((_, m) => memberLogs[m][v])
                  return (
                    <LedgerLine
                      key={v}
                      tag={`V${v + 1}`}
                      entry={unitStatuses[v]}
                      onReset={() => resetRound(v)}
                      onOmit={() => omitRound(v)}
                    >
                      {entries.some((e) => e.status !== "pending") ? (
                        <span className="space-x-3">
                          {members.map((it, mi) => (
                            <span key={it.ex.name}>
                              <span className="mr-1 text-primary/70">
                                {it.letter}
                              </span>
                              <SetRecord s={entries[mi]} />
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/35">
                          sin registrar
                        </span>
                      )}
                    </LedgerLine>
                  )
                })
              : memberLogs[0].map((s, i) => (
                  <LedgerLine
                    key={i}
                    tag={`S${i + 1}`}
                    entry={s.status}
                    onReset={() => resetRound(i)}
                    onOmit={() => omitRound(i)}
                  >
                    <SetRecord s={s} />
                  </LedgerLine>
                ))}
          </ul>
        </Disclosure>

        {hasHistory && (
          <Disclosure
            eyebrow="Progresión"
            delay="200ms"
            meta={
              <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground/60 uppercase">
                top set
              </span>
            }
          >
            <ProgressionRail name={ex.name} />
          </Disclosure>
        )}
      </div>

      {/* Navegación entre ejercicios + reset */}
      <div className="fade-up border-t border-white/10 pt-5 [--delay:240ms]">
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
                <span className="shrink-0 text-primary">✓</span>
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
            className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/50 uppercase transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Reiniciar ejercicio
          </button>
        </div>
      </div>

      {/* Pie fijo: descanso (al completar) + acciones */}
      <div className="sticky bottom-0 z-20 -mx-5 mt-auto border-t border-white/10 bg-background/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {resting && (
          <div className="mb-3">
            <RestTimer
              rest={ex.rest}
              onSkip={() => setResting(false)}
              onDone={() => setResting(false)}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button
            onClick={completeUnit}
            disabled={!canComplete}
            className="h-12 flex-1 text-[12px] font-semibold tracking-[0.16em] uppercase"
          >
            <Check className="size-4" />
            Completar {unit}
          </Button>
          <button
            type="button"
            onClick={skipUnit}
            className="shrink-0 cursor-pointer px-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            Omitir
          </button>
        </div>
      </div>
    </main>
  )
}

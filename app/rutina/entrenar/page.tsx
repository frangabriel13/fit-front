import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: "Entrenando · FitFront",
}

// ⚠️ Pantalla VISUAL (mock estático, sin lógica). Deriva todo de ROUTINE +
// SESSION + WORKOUT_POSITION (lib/routine-data). Cambiá WORKOUT_POSITION
// para previsualizar la variante biserie. La interactividad (steppers,
// temporizador, completar) llega con el backend; aquí son placeholders.
//
// "Modo foco": un solo protagonista en pantalla —la serie actual— con el
// historial y la progresión plegados en <details> nativos (sin JS) y la
// acción principal fija al pie.

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

function logsOf(name: string, sets: number): SetEntry[] {
  return (
    SESSION.logs[name] ??
    Array.from({ length: sets }, () => ({ status: "pending" as const }))
  )
}

function slotTitle(slot: Slot): string {
  return slot.items.length > 1
    ? slot.items.map((it) => it.ex.name).join(" + ")
    : slot.items[0].ex.name
}

/** "4'" → "4:00", "90''" → "1:30". Para mostrar el descanso como reloj. */
function restToClock(rest: string): string {
  const n = parseInt(rest.replace(/\D/g, ""), 10)
  if (Number.isNaN(n)) return rest
  const total = rest.includes("''") ? n : n * 60
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

// ─── piezas visuales ─────────────────────────────────────────────────────────

/** Botón redondo de stepper (visual). */
function StepBtn({
  kind,
  label,
}: {
  kind: "minus" | "plus"
  label: string
}) {
  const Icon = kind === "minus" ? Minus : Plus
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-muted-foreground transition-colors",
        kind === "plus"
          ? "hover:border-primary/50 hover:text-primary"
          : "hover:border-white/35 hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** Stepper grande en caja: − valor + con label arriba y pista abajo. */
function Stepper({
  label,
  value,
  suffix,
  hint,
}: {
  label: string
  value?: string
  suffix?: string
  hint?: string
}) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
      <p className="text-center font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-1">
        <StepBtn kind="minus" label={`Bajar ${label}`} />
        <span className="flex items-baseline justify-center">
          <span
            className={cn(
              "font-display text-3xl leading-none tabular-nums",
              value ? "text-foreground" : "text-muted-foreground/30"
            )}
          >
            {value ?? "—"}
          </span>
          {suffix && (
            <span className="ml-0.5 font-mono text-[10px] text-muted-foreground">
              {suffix}
            </span>
          )}
        </span>
        <StepBtn kind="plus" label={`Subir ${label}`} />
      </div>
      <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground/50">
        {hint ?? " "}
      </p>
    </div>
  )
}

/** Temporizador de descanso — estático (idle). Cuenta regresiva al cablear. */
function RestTimer({ rest, chained }: { rest: string; chained: boolean }) {
  return (
    <div className="fade-up rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3.5 [--delay:120ms]">
      <div className="flex items-center gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
          <Timer className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">
            Descanso
          </p>
          <p className="font-display text-3xl leading-none tabular-nums text-foreground">
            {restToClock(rest)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/15 px-2.5 py-1 transition-colors hover:border-white/35 hover:text-foreground"
          >
            −15s
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/15 px-2.5 py-1 transition-colors hover:border-white/35 hover:text-foreground"
          >
            saltar
          </button>
        </div>
      </div>
      <p className="mt-2.5 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/60">
        {chained
          ? "comienza al cerrar la vuelta (tras la última estación)"
          : "comienza automáticamente al completar la serie"}
      </p>
    </div>
  )
}

/** Línea del ledger: tally + etiqueta + registro + micro-acciones. */
function LedgerLine({
  tag,
  entry,
  children,
}: {
  tag: string
  entry: SetEntry["status"]
  children: React.ReactNode
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
            className="cursor-pointer rounded p-1 transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </button>
          {entry === "done" && (
            <button
              type="button"
              aria-label={`Marcar ${tag} como no hecha`}
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
  meta?: React.ReactNode
  children: React.ReactNode
  delay: string
}) {
  return (
    <details
      className="group fade-up border-t border-white/10"
      style={{ "--delay": delay } as React.CSSProperties}
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

// ─── página ──────────────────────────────────────────────────────────────────

export default function EntrenarPage() {
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
  const isSuper = slot.items.length > 1
  const active =
    slot.items.find((it) => it.ex.name === WORKOUT_POSITION.exerciseName) ??
    slot.items[0]
  const ex = active.ex

  const prev = slots[slotIdx - 1]
  const next = slots[slotIdx + 1]

  // Serie/vuelta activa: primera sin registrar.
  const logs = logsOf(ex.name, ex.sets)
  const activeSet = Math.max(
    logs.findIndex((s) => s.status === "pending"),
    0
  )
  const lastDone = [...logs].reverse().find((s) => s.status === "done")
  const unit = isSuper ? "vuelta" : "serie"

  // Biserie: logs de cada miembro para el ledger por vueltas.
  const memberLogs = slot.items.map((it) => logsOf(it.ex.name, it.ex.sets))

  // Estado por unidad (serie simple o vuelta de biserie) para el mini-tally
  // del héroe y el resumen del ledger.
  const unitStatuses: SetStatus[] = isSuper
    ? Array.from({ length: ex.sets }, (_, v) => {
        const entries = memberLogs.map((ml) => ml[v])
        return entries.every((e) => e?.status === "done")
          ? "done"
          : entries.every((e) => e?.status === "skipped")
            ? "skipped"
            : "pending"
      })
    : logs.map((s) => s.status)
  const doneUnits = unitStatuses.filter((s) => s === "done").length

  const hasHistory = Boolean(HISTORY[ex.name])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10">
      {/* Barra superior — sticky para conservar contexto al hacer scroll */}
      <div className="sticky top-0 z-20 -mx-5 flex items-center justify-between border-b border-white/10 bg-background/90 px-5 pt-5 pb-4 backdrop-blur">
        <Link
          href="/rutina"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Rutina
        </Link>
        <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
          Día {String(day.order).padStart(2, "0")} — {day.name}
        </p>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {slot.num}/{String(slots.length).padStart(2, "0")}
        </span>
      </div>

      {/* Progreso de la sesión — un segmento por ejercicio del día */}
      <div className="fade-up flex items-center gap-3 py-4">
        <div className="flex flex-1 items-center gap-1.5">
          {slots.map((s, i) => {
            const st = slotState(s)
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
      <div className="fade-up pt-4 pb-5 [--delay:40ms]">
        <p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-primary uppercase">
          Ejercicio {slot.num}
          {isSuper && ` · ${slot.items.length === 2 ? "biserie" : "superserie"}`}
        </p>

        {isSuper ? (
          <div className="mt-2 space-y-1">
            {slot.items.map((it) => {
              const isActive = it.ex.name === ex.name
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

      {/* Card-héroe: la serie/vuelta actual (el protagonista) */}
      <section className="fade-up rounded-3xl border border-white/12 bg-card/50 p-5 shadow-[0_8px_40px_-16px] shadow-primary/20 [--delay:80ms]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
            {unit} {activeSet + 1} de {ex.sets}
            {isSuper && ` — ${active.letter}`}
          </p>
          {lastDone && (
            <p className="font-mono text-[11px] text-muted-foreground">
              anterior:{" "}
              <span className="text-foreground/80">
                {lastDone.weight} kg × {lastDone.reps}
              </span>
            </p>
          )}
        </div>

        {/* Steppers principales: peso y reps */}
        <div className="mt-4 flex gap-3">
          <Stepper
            label="Peso"
            value={lastDone?.weight != null ? String(lastDone.weight) : undefined}
            suffix="kg"
            hint={lastDone ? `= ${unit} anterior` : "registrá el peso"}
          />
          <Stepper label="Reps" hint={`obj. ${sheet(ex.reps)}`} />
        </div>

        {/* RIR — control secundario compacto */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            RIR
          </span>
          <div className="flex items-center gap-3">
            <StepBtn kind="minus" label="Bajar RIR" />
            <span className="min-w-[1.5ch] text-center font-display text-2xl leading-none tabular-nums text-muted-foreground/30">
              —
            </span>
            <StepBtn kind="plus" label="Subir RIR" />
            <span className="ml-1 font-mono text-[9px] text-muted-foreground/50">
              obj. {sheet(ex.effort)}
            </span>
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
            {isSuper ? "vueltas" : "series"} {doneUnits}/{ex.sets}
          </span>
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/60">
          {isSuper ? (
            <>
              → seguí{" "}
              {slot.items.find((it) => it.ex.name !== ex.name)?.letter}, sin
              pausa · descanso {sheet(ex.rest)} al cerrar la vuelta
            </>
          ) : (
            <>al completar arranca el descanso de {sheet(ex.rest)}</>
          )}
        </p>
      </section>

      {/* Temporizador de descanso */}
      <div className="mt-4">
        <RestTimer rest={ex.rest} chained={isSuper} />
      </div>

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
                {doneUnits}/{ex.sets}
              </span>
            </>
          }
        >
          <ul className="space-y-2.5">
            {isSuper
              ? Array.from({ length: ex.sets }, (_, v) => {
                  const entries = memberLogs.map((ml) => ml[v])
                  return (
                    <LedgerLine key={v} tag={`V${v + 1}`} entry={unitStatuses[v]}>
                      {entries.some((e) => e?.status !== "pending") ? (
                        <span className="space-x-3">
                          {slot.items.map((it, mi) => (
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
              : logs.map((s, i) => (
                  <LedgerLine key={i} tag={`S${i + 1}`} entry={s.status}>
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
          {prev ? (
            <Link
              href="/rutina/entrenar"
              className="group inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="truncate">
                {prev.num} {slotTitle(prev)}
              </span>
              {slotState(prev) === "done" && (
                <span className="shrink-0 text-primary">✓</span>
              )}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href="/rutina/entrenar"
              className="group inline-flex min-w-0 items-center gap-2 text-right text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="truncate">
                {next.num} {slotTitle(next)}
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
            className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/50 uppercase transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Reiniciar ejercicio
          </button>
        </div>
      </div>

      {/* Barra de acción fija al pie */}
      <div className="sticky bottom-0 z-20 -mx-5 mt-auto flex items-center gap-3 border-t border-white/10 bg-background/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button className="h-12 flex-1 text-[12px] font-semibold tracking-[0.16em] uppercase">
          <Check className="size-4" />
          Completar {unit}
        </Button>
        <button
          type="button"
          className="shrink-0 cursor-pointer px-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Omitir
        </button>
      </div>
    </main>
  )
}

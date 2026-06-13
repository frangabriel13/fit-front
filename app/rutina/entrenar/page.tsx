import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react"

import {
  exerciseState,
  ROUTINE,
  SESSION,
  WORKOUT_POSITION,
  type ExerciseState,
  type SetEntry,
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
// para previsualizar la variante biserie. La interactividad llega con el
// backend.

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

// ─── piezas visuales ─────────────────────────────────────────────────────────

/** Campo de "formulario de papel": valor grande sobre subrayado punteado. */
function PaperField({
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
    <div className="flex-1">
      <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1.5 border-b border-dashed border-white/25 pb-1.5">
        <span
          className={cn(
            "font-display text-3xl leading-none",
            value ? "text-foreground" : "text-muted-foreground/25"
          )}
        >
          {value ?? "—"}
        </span>
        {suffix && (
          <span className="ml-1 font-mono text-[11px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-1.5 font-mono text-[9px] text-muted-foreground/50">
        {hint ?? " "}
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-5 pb-10">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
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
        <span className="font-mono text-[11px] text-muted-foreground">
          {slot.num}/{String(slots.length).padStart(2, "0")}
        </span>
      </div>

      {/* Índice tipográfico de ejercicios */}
      <div className="fade-up flex items-baseline gap-5 border-b border-white/10 py-3.5 font-mono text-[13px] leading-none">
        {slots.map((s, i) => {
          const st = slotState(s)
          const current = i === slotIdx
          return (
            <span
              key={s.num}
              className={cn(
                "pb-0.5",
                current &&
                  "text-foreground underline decoration-primary decoration-2 underline-offset-4",
                !current && st === "done" && "text-primary",
                !current && st === "in-progress" && "text-ember",
                !current && st === "pending" && "text-muted-foreground/35"
              )}
            >
              {s.num}
            </span>
          )
        })}
      </div>

      {/* Título */}
      <div className="fade-up py-6 [--delay:60ms]">
        <p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-primary uppercase">
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

      {/* Serie / vuelta activa — formulario de papel */}
      <div className="fade-up border-y border-white/10 py-6 [--delay:120ms]">
        <div className="flex items-baseline justify-between">
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

        <div className="mt-5 flex gap-6">
          <PaperField
            label="Peso"
            value={lastDone?.weight != null ? String(lastDone.weight) : undefined}
            suffix="kg"
            hint={lastDone ? `= ${unit} anterior` : undefined}
          />
          <PaperField label="Reps" hint={`obj. ${sheet(ex.reps)}`} />
          <PaperField label="RIR" hint={`obj. ${sheet(ex.effort)}`} />
        </div>

        <div className="mt-5 flex items-center gap-4">
          <Button className="h-11 flex-1 text-[12px] font-semibold tracking-[0.16em] uppercase">
            <Check className="size-4" />
            Completar {unit}
          </Button>
          <button
            type="button"
            className="cursor-pointer font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            omitir
          </button>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-[0.08em] text-muted-foreground/60">
          {isSuper ? (
            <>
              → sigue {slot.items.find((it) => it.ex.name !== ex.name)?.letter},
              sin pausa · descanso {sheet(ex.rest)} al cerrar la vuelta
            </>
          ) : (
            <>al completar arranca el descanso de {sheet(ex.rest)}</>
          )}
        </p>
      </div>

      {/* Ledger */}
      <div className="fade-up border-b border-white/10 py-6 [--delay:180ms]">
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          {isSuper ? "Vueltas" : "Series"}
        </p>
        <ul className="mt-3 space-y-2.5">
          {isSuper
            ? Array.from({ length: ex.sets }, (_, v) => {
                const entries = memberLogs.map((ml) => ml[v])
                const st: SetEntry["status"] = entries.every(
                  (e) => e?.status === "done"
                )
                  ? "done"
                  : entries.every((e) => e?.status === "skipped")
                    ? "skipped"
                    : "pending"
                return (
                  <LedgerLine key={v} tag={`V${v + 1}`} entry={st}>
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
      </div>

      {/* Progresión */}
      <div className="fade-up border-b border-white/10 py-6 [--delay:240ms]">
        <ProgressionRail name={ex.name} />
      </div>

      {/* Navegación + reset */}
      <div className="fade-up pt-6 [--delay:300ms]">
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
        <div className="mt-6 text-center">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/50 uppercase transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Reiniciar ejercicio
          </button>
        </div>
      </div>
    </main>
  )
}

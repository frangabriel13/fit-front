"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, Check, Minus, Play, RotateCcw, X } from "lucide-react"

import {
  exerciseState,
  HISTORY,
  ROUTINE,
  SESSION,
  type ExerciseState,
  type HistSet,
  type RoutineExercise,
  type SetEntry,
} from "@/lib/routine-data"
// (piezas compartidas de planilla en sheet-bits)
import {
  ProgressionRail,
  sheet,
  toSheetItems,
  type SheetItem,
} from "@/components/routine/sheet-bits"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Columnas: nº · ejercicio · series · reps · rir · descanso · acciones.
const COLS =
  "md:grid md:grid-cols-[2.75rem_minmax(0,1fr)_3.5rem_4.5rem_4rem_4.5rem_4.5rem] md:items-center md:gap-3"

// ─── indicador de estado (chip de número con color por estado) ──────────────

function NumberChip({
  num,
  letter,
  state,
}: {
  num: string
  letter?: string
  state: ExerciseState
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl font-display text-base leading-none ring-1 transition-colors",
        state === "done" && "bg-primary/15 text-primary ring-primary/30",
        state === "in-progress" && "bg-ember/15 text-ember ring-ember/35",
        state === "pending" && "bg-white/[0.04] text-muted-foreground ring-white/10"
      )}
    >
      {state === "done" ? (
        <Check className="size-5" strokeWidth={2.5} />
      ) : (
        <>
          {num}
          {letter && (
            <span className="ml-0.5 text-[0.7em] opacity-70">{letter}</span>
          )}
        </>
      )}
    </span>
  )
}

// ─── acciones (play + chevron) ───────────────────────────────────────────────

function RowActions({
  name,
  state,
  className,
}: {
  name: string
  state: ExerciseState
  className?: string
}) {
  return (
    <span className={cn("flex items-center justify-end", className)}>
      <Link
        href="/rutina/entrenar"
        aria-label={`Entrenar ${name}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border transition-colors md:size-9",
          state === "in-progress"
            ? "border-ember/50 text-ember hover:bg-ember hover:text-background"
            : "border-white/12 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        )}
      >
        <Play className="size-3.5 fill-current" />
      </Link>
    </span>
  )
}

// ─── fila de ejercicio (simple o miembro A/B de una superserie) ─────────────

function SheetRow({
  item,
  expanded,
  onToggle,
}: {
  item: SheetItem
  expanded: boolean
  onToggle: () => void
}) {
  const { ex, num, letter, chains } = item
  const state = exerciseState(SESSION.logs[ex.name])

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/40 transition-colors",
        expanded ? "border-white/15 bg-card/60" : "border-white/8 hover:border-white/15"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-expanded={expanded}
        aria-label={`Ver detalle de ${ex.name}`}
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-3 outline-none md:px-4",
          COLS
        )}
      >
        <NumberChip num={num} letter={letter} state={state} />

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[15px] font-medium",
              state === "done" ? "text-foreground/65" : "text-foreground"
            )}
          >
            {ex.name}
          </span>
          <span className="mt-1.5 block font-mono text-[12px] text-muted-foreground md:hidden">
            {ex.sets} × {sheet(ex.reps)} · RIR {sheet(ex.effort)} ·{" "}
            {chains ? <span className="text-primary/80">→</span> : sheet(ex.rest)}
          </span>
        </div>

        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {ex.sets}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {sheet(ex.reps)}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/90 md:block">
          {sheet(ex.effort)}
        </span>
        <span
          className={cn(
            "hidden text-center font-mono text-[13px] md:block",
            chains ? "text-primary/80" : "text-foreground/90"
          )}
        >
          {chains ? "→" : sheet(ex.rest)}
        </span>

        <RowActions name={ex.name} state={state} className="shrink-0" />
      </div>

      {expanded && <RowDetail ex={ex} />}
    </li>
  )
}

// ─── comparación de una serie contra la semana anterior ────────────────────

type Delta = { dir: "up" | "down" | "flat"; value: string; unit: string }

/** Progreso de una serie: prioriza el salto de peso; si empató, mira reps. */
function setDelta(today: SetEntry, prev?: HistSet): Delta | null {
  if (!prev || today.weight == null) return null
  const dw = Math.round((today.weight - prev.weight) * 10) / 10
  if (dw !== 0)
    return { dir: dw > 0 ? "up" : "down", value: `${dw > 0 ? "+" : ""}${dw}`, unit: "kg" }
  const dr = (today.reps ?? 0) - prev.reps
  if (dr !== 0)
    return {
      dir: dr > 0 ? "up" : "down",
      value: `${dr > 0 ? "+" : ""}${dr}`,
      unit: Math.abs(dr) === 1 ? "rep" : "reps",
    }
  return { dir: "flat", value: "igual", unit: "" }
}

function DeltaChip({ d }: { d: Delta }) {
  const Icon = d.dir === "up" ? ArrowUp : d.dir === "down" ? ArrowDown : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
        d.dir === "up" && "bg-primary/15 text-primary",
        d.dir === "down" && "bg-ember/15 text-ember",
        d.dir === "flat" && "bg-secondary text-muted-foreground"
      )}
    >
      <Icon className="size-2.5" strokeWidth={2.5} />
      {d.value}
      {d.unit && <span className="opacity-70">{d.unit}</span>}
    </span>
  )
}

/** Nodo con el número de serie, coloreado por estado. */
function SetNode({ n, status }: { n: number; status: SetEntry["status"] }) {
  return (
    <span
      className={cn(
        "grid size-6 place-items-center rounded-md font-mono text-[10px] font-medium tabular-nums ring-1 ring-inset",
        status === "done" && "bg-primary/15 text-primary ring-primary/35",
        status === "skipped" && "bg-secondary text-muted-foreground/70 ring-border",
        status === "pending" && "bg-secondary/50 text-muted-foreground/50 ring-border/60"
      )}
    >
      {n}
    </span>
  )
}

// ─── detalle expandido: series de hoy, comparación, acciones ────────────────

function RowDetail({ ex }: { ex: RoutineExercise }) {
  const logs =
    SESSION.logs[ex.name] ??
    Array.from({ length: ex.sets }, () => ({ status: "pending" as const }))
  const hist = HISTORY[ex.name]

  return (
    <div className="fade-up border-t border-border bg-card px-4 py-5 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {/* ── Registro de hoy + comparación con la semana anterior ── */}
        <section className="rounded-2xl bg-secondary p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3 px-2">
            <p className="font-mono text-[10px] font-semibold tracking-[0.22em] text-primary uppercase">
              Registro de hoy
            </p>
            <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/55 uppercase">
              Sem. anterior
            </p>
          </div>

          <ul className="divide-y divide-border/50">
            {logs.map((s, i) => {
              const prev = hist?.weeks.at(-1)?.[i]
              const delta = s.status === "done" ? setDelta(s, prev) : null
              return (
                <li
                  key={i}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-2.5 px-2 py-2.5"
                >
                  <span className="flex justify-center">
                    <SetNode n={i + 1} status={s.status} />
                  </span>

                  {/* HOY — todo en una sola línea */}
                  {s.status === "done" ? (
                    <div className="flex min-w-0 items-baseline gap-x-2">
                      <span className="font-mono text-[15px] tabular-nums whitespace-nowrap text-foreground">
                        <span className="font-semibold">{s.weight}</span>
                        <span className="text-[10px] text-muted-foreground/70"> kg</span>
                        <span className="text-muted-foreground"> × {s.reps}</span>
                      </span>
                      {s.rir != null && (
                        <span className="hidden font-mono text-[10px] whitespace-nowrap text-muted-foreground/55 sm:inline">
                          RIR {s.rir}
                        </span>
                      )}
                      {delta && <DeltaChip d={delta} />}
                    </div>
                  ) : s.status === "skipped" ? (
                    <span className="font-mono text-[12px] text-muted-foreground italic line-through decoration-muted-foreground/40">
                      omitida
                    </span>
                  ) : (
                    <span className="font-mono text-[12px] text-muted-foreground/45">
                      pendiente
                    </span>
                  )}

                  {/* SEM. ANTERIOR — referencia, alineada a la derecha */}
                  <span className="justify-self-end font-mono text-[12px] tabular-nums whitespace-nowrap text-muted-foreground/75">
                    {prev ? (
                      <>
                        {prev.weight}
                        <span className="text-muted-foreground/45"> × {prev.reps}</span>
                        <span className="hidden text-[10px] text-muted-foreground/45 sm:inline">
                          {" "}
                          · RIR {prev.rir}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ── Progresión a lo largo del macrociclo ── */}
        {hist && (
          <section className="rounded-2xl bg-secondary p-4">
            <ProgressionRail name={ex.name} />
          </section>
        )}
      </div>

      {/* Acciones: primaria + secundarias, con la destructiva apartada */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Link
          href="/rutina/entrenar"
          className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-[0_8px_24px_-12px] shadow-primary/60 transition-colors hover:bg-primary/90 md:inline-flex"
        >
          <Play className="size-3 fill-current" />
          Entrenar
        </Link>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:bg-secondary hover:text-foreground md:py-2"
        >
          <RotateCcw className="size-3" />
          Reiniciar
        </button>
        <button
          type="button"
          className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground/70 uppercase transition-colors hover:bg-destructive/10 hover:text-destructive md:py-2"
        >
          <X className="size-3" />
          No realizado
        </button>
      </div>
    </div>
  )
}

// ─── vista principal ────────────────────────────────────────────────────────

export function RoutineView() {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const day = ROUTINE.days[active]
  const items = toSheetItems(day.exercises)

  const hasSession = day.id === SESSION.dayId
  const doneCount = day.exercises.filter(
    (e) => exerciseState(SESSION.logs[e.name]) === "done"
  ).length

  const toggle = (key: string) =>
    setExpanded((cur) => (cur === key ? null : key))

  return (
    <div>
      {/* Tabs tipográficos de día */}
      <nav className="-mx-4 flex gap-6 overflow-x-auto border-b border-white/10 px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {ROUTINE.days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => {
              setActive(i)
              setExpanded(null)
            }}
            className="relative shrink-0 cursor-pointer pb-3 text-left outline-none"
          >
            <span
              className={cn(
                "mr-2 font-mono text-[10px]",
                i === active ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              {String(d.order).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "font-display text-xl tracking-wide uppercase transition-colors",
                i === active
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {d.name}
              {d.placeholder && <sup className="ml-0.5 text-primary/70">*</sup>}
            </span>
            {i === active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* Tarjeta de sesión */}
      <div
        key={`session-${day.id}`}
        className="fade-up mt-5 hidden flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-2xl border border-white/10 bg-card/40 px-5 py-4 md:flex"
      >
        <div className="min-w-0">
          {hasSession ? (
            <>
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-ember" />
                <span className="text-ember">En curso</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">empezado 18:40</span>
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                <span className="font-display text-lg text-primary">
                  {doneCount}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  de {day.exercises.length} ejercicios completados
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                Sin empezar
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="text-foreground">
                  {day.exercises.length} ejercicios
                </span>{" "}
                · {day.focus}
              </p>
            </>
          )}
        </div>
        <span className="hidden items-center gap-1.5 md:flex">
          {hasSession && (
            <button
              type="button"
              aria-label="Reiniciar entrenamiento"
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground/70 transition-colors hover:bg-white/[0.04] hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <Button
            asChild
            className="h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase shadow-[0_8px_30px_-10px] shadow-primary/50 transition-shadow hover:shadow-primary/70"
          >
            <Link href="/rutina/entrenar">
              <Play className="size-3.5 fill-current" />
              {hasSession ? "Reanudar" : "Comenzar"}
            </Link>
          </Button>
        </span>
      </div>

      {/* Encabezado de columnas (md+) */}
      <div
        className={cn(
          "mt-6 hidden px-4 pb-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/80 uppercase",
          COLS
        )}
      >
        <span>Nº</span>
        <span>Ejercicio</span>
        <span className="text-center">Series</span>
        <span className="text-center">Reps</span>
        <span className="text-center">RIR</span>
        <span className="text-center">Desc.</span>
        <span />
      </div>

      {/* Planilla */}
      <ul
        key={`sheet-${day.id}`}
        className="fade-up mt-5 space-y-2 [--delay:60ms] md:mt-0"
      >
        {items.map((item) => (
          <SheetRow
            key={item.ex.name}
            item={item}
            expanded={expanded === item.ex.name}
            onToggle={() => toggle(item.ex.name)}
          />
        ))}
      </ul>

      {/* Nota de día de ejemplo (placeholder del mock) */}
      {day.placeholder && (
        <p className="mt-6 rounded-2xl border border-white/8 bg-white/[0.015] px-5 py-4 font-mono text-[11px] text-muted-foreground">
          <span className="mr-2 font-semibold text-primary/90">*</span>
          Día de ejemplo — editalo a gusto.
        </p>
      )}

      {/* CTA de sesión fijo al pulgar (solo móvil) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)]">
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70 uppercase">
              Día {String(day.order).padStart(2, "0")} · {day.name}
            </p>
            <p className="mt-0.5 truncate text-[13px]">
              {hasSession ? (
                <span className="flex items-center gap-1.5 text-ember">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-ember" />
                  En curso · {doneCount}/{day.exercises.length}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {day.exercises.length} ejercicios · {day.focus}
                </span>
              )}
            </p>
          </div>
          <Button
            asChild
            className="h-12 shrink-0 px-6 text-[12px] font-semibold tracking-[0.16em] uppercase shadow-[0_8px_30px_-10px] shadow-primary/50"
          >
            <Link href="/rutina/entrenar">
              <Play className="size-4 fill-current" />
              {hasSession ? "Reanudar" : "Comenzar"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

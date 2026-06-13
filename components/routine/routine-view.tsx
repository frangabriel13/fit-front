"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Play, RotateCcw, X } from "lucide-react"

import {
  exerciseState,
  HISTORY,
  ROUTINE,
  SESSION,
  type ExerciseState,
  type RoutineExercise,
} from "@/lib/routine-data"
// (piezas compartidas de planilla en sheet-bits)
import {
  ProgressionRail,
  SetTally,
  sheet,
  toSheetItems,
  type SheetItem,
} from "@/components/routine/sheet-bits"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Columnas: nº · ejercicio · series · reps · rir · descanso · acciones.
const COLS =
  "md:grid md:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_4.5rem_4rem_4.5rem_4.5rem] md:items-center md:gap-2"

function numClass(state: ExerciseState): string {
  return cn(
    "font-display text-lg leading-none",
    state === "done" && "text-primary",
    state === "in-progress" &&
      "text-foreground underline decoration-ember decoration-2 underline-offset-4",
    state === "pending" && "text-muted-foreground/50"
  )
}

function StatusText({ state }: { state: ExerciseState }) {
  return (
    <span
      className={cn(
        "mt-0.5 block font-mono text-[10px] tracking-[0.14em] uppercase",
        state === "done" && "text-primary",
        state === "in-progress" && "text-ember",
        state === "pending" && "text-muted-foreground/50"
      )}
    >
      {state === "done"
        ? "completado"
        : state === "in-progress"
          ? "en curso"
          : "pendiente"}
    </span>
  )
}

// ─── acciones (play + chevron) ───────────────────────────────────────────────

function RowActions({
  name,
  state,
  expanded,
  onToggle,
  className,
}: {
  name: string
  state: ExerciseState
  expanded: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <span className={cn("flex items-center justify-end gap-1.5", className)}>
      <Link
        href="/rutina/entrenar"
        aria-label={`Entrenar ${name}`}
        className={cn(
          "flex size-7 items-center justify-center rounded-md border transition-colors",
          state === "in-progress"
            ? "border-ember/50 text-ember hover:bg-ember hover:text-background"
            : "border-white/12 text-muted-foreground hover:border-primary/50 hover:text-primary"
        )}
      >
        <Play className="size-3 fill-current" />
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Ver detalle"
        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-300",
            expanded && "rotate-180"
          )}
        />
      </button>
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
  const rest = chains ? "→" : sheet(ex.rest)

  return (
    <li>
      <div
        className={cn(
          "group/row -mx-2 rounded-md px-2 py-3.5 transition-colors hover:bg-white/[0.025]",
          COLS
        )}
      >
        <span className={numClass(state)}>
          {num}
          {letter && (
            <span className="ml-0.5 text-[0.7em] text-primary">{letter}</span>
          )}
        </span>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-1 min-w-0 cursor-pointer text-left outline-none md:mt-0"
        >
          <span
            className={cn(
              "block truncate text-[15px] font-medium",
              state === "done" ? "text-foreground/55" : "text-foreground/95"
            )}
          >
            {ex.name}
          </span>
          <StatusText state={state} />
          <span className="mt-1 block font-mono text-[12px] text-muted-foreground md:hidden">
            {ex.sets} × {sheet(ex.reps)} · RIR {sheet(ex.effort)} ·{" "}
            {chains ? "sin pausa →" : sheet(ex.rest)}
          </span>
        </button>

        <span className="hidden text-center font-mono text-[13px] text-foreground/85 md:block">
          {ex.sets}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/85 md:block">
          {sheet(ex.reps)}
        </span>
        <span className="hidden text-center font-mono text-[13px] text-foreground/85 md:block">
          {sheet(ex.effort)}
        </span>
        <span
          className={cn(
            "hidden text-center font-mono text-[13px] md:block",
            chains ? "text-primary/70" : "text-foreground/85"
          )}
        >
          {rest}
        </span>

        <RowActions
          name={ex.name}
          state={state}
          expanded={expanded}
          onToggle={onToggle}
          className="mt-2 md:mt-0"
        />
      </div>

      {expanded && <RowDetail ex={ex} />}
    </li>
  )
}

// ─── detalle expandido: series de hoy, comparación, acciones ────────────────

function RowDetail({ ex }: { ex: RoutineExercise }) {
  const logs =
    SESSION.logs[ex.name] ??
    Array.from({ length: ex.sets }, () => ({ status: "pending" as const }))
  const hist = HISTORY[ex.name]

  return (
    <div className="fade-up mt-1 mb-7 ml-2 border-l border-white/12 pt-1 pb-1 pl-5 md:ml-[1.05rem] md:pl-8">
      <div className={cn("grid gap-x-12 gap-y-7", hist && "md:grid-cols-2")}>
        {/* Libro de series de hoy */}
        <section>
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              Series de hoy
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/50">
              obj. {ex.sets}×{sheet(ex.reps)} · RIR {sheet(ex.effort)}
            </p>
          </div>
          <ul className="mt-3 space-y-2.5">
            {logs.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground/50">
                  S{i + 1}
                </span>
                <SetTally status={s.status} />
                <span className="flex-1 font-mono text-[13px]">
                  {s.status === "done" && (
                    <span className="text-foreground/90">
                      {s.weight}
                      <span className="text-muted-foreground"> kg</span> ×{" "}
                      {s.reps}
                      {s.rir != null && (
                        <span className="text-muted-foreground">
                          {" "}
                          · RIR {s.rir}
                        </span>
                      )}
                    </span>
                  )}
                  {s.status === "skipped" && (
                    <span className="text-muted-foreground italic line-through decoration-muted-foreground/40">
                      omitida
                    </span>
                  )}
                  {s.status === "pending" && (
                    <span className="text-muted-foreground/35">
                      sin registrar
                    </span>
                  )}
                </span>
                {s.status !== "pending" && (
                  <span className="flex items-center gap-0.5 text-muted-foreground/40">
                    <button
                      type="button"
                      aria-label={`Resetear serie ${i + 1}`}
                      className="cursor-pointer rounded p-1 transition-colors hover:text-foreground"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                    {s.status === "done" && (
                      <button
                        type="button"
                        aria-label={`Marcar serie ${i + 1} como no hecha`}
                        className="cursor-pointer rounded p-1 transition-colors hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Línea de progresión a lo largo del macrociclo */}
        {hist && <ProgressionRail name={ex.name} />}
      </div>

      {/* Acciones */}
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/8 pt-4 font-mono text-[11px] tracking-[0.16em] uppercase">
        <Link
          href="/rutina/entrenar"
          className="inline-flex items-center gap-1.5 text-primary transition-colors hover:text-primary/75"
        >
          <Play className="size-3 fill-current" />
          Entrenar
        </Link>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Reiniciar
        </button>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-destructive"
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

  const supersetRest = items.find((it) => it.chains)?.ex.rest
  const hasFallo = day.exercises.some((e) => e.effort.includes("fallo"))

  const toggle = (key: string) =>
    setExpanded((cur) => (cur === key ? null : key))

  return (
    <div>
      {/* Tabs tipográficos de día */}
      <nav className="flex gap-7 overflow-x-auto border-b border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                i === active ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {String(d.order).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "font-display text-xl tracking-wide uppercase transition-colors",
                i === active
                  ? "text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              {d.name}
              {d.placeholder && <sup className="ml-0.5 text-primary/60">*</sup>}
            </span>
            {i === active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* Franja de sesión */}
      <div
        key={`session-${day.id}`}
        className="fade-up flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-white/10 py-4"
      >
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {hasSession ? (
            <>
              <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle" />
              <span className="text-foreground">en curso</span> — {doneCount} de{" "}
              {day.exercises.length} completados · empezado 18:40
            </>
          ) : (
            <>
              sin empezar — {day.exercises.length} ejercicios · {day.focus}
            </>
          )}
        </p>
        <span className="flex items-center gap-1.5">
          {hasSession && (
            <button
              type="button"
              aria-label="Reiniciar entrenamiento"
              className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <Button
            asChild
            className="h-9 px-4 text-[11px] font-semibold tracking-[0.16em] uppercase"
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
          "hidden border-b border-white/10 pt-5 pb-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase",
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
        className="fade-up divide-y divide-white/8 [--delay:60ms]"
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

      {/* Notas de planilla */}
      <div className="mt-2 space-y-1.5 border-t border-white/10 pt-4 font-mono text-[11px] text-muted-foreground/70">
        {supersetRest && (
          <p>
            <span className="mr-2 text-primary/80">A·B</span>
            Superserie: van seguidos, sin pausa; el descanso ({sheet(supersetRest)})
            corre al cerrar cada vuelta.
          </p>
        )}
        {hasFallo && (
          <p>
            <span className="mr-2 text-primary/80">F</span>
            Al fallo.
          </p>
        )}
        {day.placeholder && (
          <p>
            <span className="mr-2 text-primary/80">*</span>
            Día de ejemplo — editalo a gusto.
          </p>
        )}
      </div>
    </div>
  )
}

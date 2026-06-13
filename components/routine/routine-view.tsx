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
          "group/row -mx-2 rounded-md px-2 py-3.5 transition-colors hover:bg-white/[0.04]",
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
              state === "done" ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {ex.name}
          </span>
          <StatusText state={state} />
          <span className="mt-1 block font-mono text-[13px] text-muted-foreground md:hidden">
            {ex.sets} × {sheet(ex.reps)} · RIR {sheet(ex.effort)} ·{" "}
            {chains ? "sin pausa →" : sheet(ex.rest)}
          </span>
        </button>

        <span className="hidden text-center font-mono text-[15px] font-medium text-foreground md:block">
          {ex.sets}
        </span>
        <span className="hidden text-center font-mono text-[15px] font-medium text-foreground md:block">
          {sheet(ex.reps)}
        </span>
        <span className="hidden text-center font-mono text-[15px] font-medium text-foreground md:block">
          {sheet(ex.effort)}
        </span>
        <span
          className={cn(
            "hidden text-center font-mono text-[15px] font-medium md:block",
            chains ? "text-primary/80" : "text-foreground"
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
    <div className="fade-up mt-1 mb-7 ml-2 border-l border-border pt-1 pb-1 pl-5 md:ml-[1.05rem] md:pl-8">
      <div
        className={cn(
          "grid gap-x-10 gap-y-7",
          hist && "md:grid-cols-[1fr_1fr_2fr]"
        )}
      >
        {/* Espejo de la semana anterior, serie por serie */}
        {hist && (
          <section>
            <p className="font-label text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Semana anterior
            </p>
            <ul className="mt-3 space-y-2.5">
              {hist.lastWeek.map((s, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground/60">
                    S{i + 1}
                  </span>
                  <span
                    aria-hidden
                    className="h-5 w-[3px] shrink-0 rounded-full bg-foreground/25"
                  />
                  <span className="flex-1 font-mono text-[13px] text-foreground/80">
                    {s.weight}
                    <span className="text-muted-foreground"> kg</span> ×{" "}
                    {s.reps}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Libro de series de hoy */}
        <section>
          <p className="font-label text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Series de hoy
          </p>
          <ul className="mt-3 space-y-2.5">
            {logs.map((s, i) => {
              const prev = hist?.lastWeek[i]
              const delta =
                s.status === "done" && s.weight != null && prev
                  ? s.weight - prev.weight
                  : null
              return (
              <li key={i} className="flex items-center gap-3">
                <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground/60">
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
                      {delta != null && delta !== 0 && (
                        <span
                          className={cn(
                            "ml-2 text-[11px]",
                            delta > 0
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {delta > 0 ? "↑" : "↓"} {delta > 0 ? "+" : ""}
                          {delta}
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
                    <span className="text-muted-foreground/60">
                      sin registrar
                    </span>
                  )}
                </span>
              </li>
              )
            })}
          </ul>
        </section>

        {/* Línea de progresión a lo largo del macrociclo */}
        {hist && <ProgressionRail name={ex.name} />}
      </div>

      {/* Acciones */}
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-label text-xs font-medium tracking-[0.12em] uppercase">
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
      <nav className="flex gap-7 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              {d.placeholder && <sup className="ml-0.5 text-primary/60">*</sup>}
            </span>
            {i === active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* Franja de sesión: ámbar cuando hay entrenamiento en curso */}
      <div
        key={`session-${day.id}`}
        className={cn(
          "fade-up mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border px-4 py-3",
          hasSession
            ? "border-ember/25 bg-ember/[0.07]"
            : "border-border bg-white/[0.02]"
        )}
      >
        <p className="font-label text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {hasSession ? (
            <>
              <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-ember align-middle" />
              <span className="text-ember">en curso</span> — {doneCount} de{" "}
              {day.exercises.length} completados ·{" "}
              <span className="font-mono font-normal">empezado 18:40</span>
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
            className="h-9 px-4 font-label text-xs font-medium tracking-[0.12em] uppercase shadow-[0_0_16px_-4px] shadow-primary/50"
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
          "hidden border-b border-border pt-6 pb-2 font-label text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase",
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
        className="fade-up divide-y divide-white/10 [--delay:60ms]"
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
      <div className="mt-2 space-y-1.5 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
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

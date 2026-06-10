"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Play, RotateCcw, X } from "lucide-react"

import {
  exerciseState,
  HISTORY,
  ROUTINE,
  SESSION,
  topWeight,
  type RoutineExercise,
} from "@/lib/routine-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Abreviaturas de planilla: "10 a 12" → "10-12", "0 o fallo" → "0-F".
function sheet(value: string): string {
  return value.replace(" o fallo", "-F").replaceAll(" a ", "-")
}

// Grilla de columnas estilo planilla (solo md+): nº · ejercicio · series ·
// reps · rir · descanso · acciones.
const COLS =
  "md:grid md:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_4.5rem_4rem_4.5rem_4.5rem] md:items-center md:gap-2"

// ─── numeración de planilla: superseries comparten número con sufijo A/B ────

interface SheetItem {
  ex: RoutineExercise
  /** "01", "04A", "04B"… */
  label: { num: string; letter?: string }
  /** Primera mitad de una superserie: encadena sin pausa con la siguiente. */
  chains: boolean
}

function toSheetItems(exercises: RoutineExercise[]): SheetItem[] {
  const items: SheetItem[] = []
  let block = 0
  let i = 0
  while (i < exercises.length) {
    block++
    const ss = exercises[i].superset
    const group = ss
      ? exercises.filter((e, j) => j >= i && e.superset === ss)
      : [exercises[i]]
    group.forEach((ex, j) => {
      items.push({
        ex,
        label: {
          num: String(block).padStart(2, "0"),
          letter: group.length > 1 ? String.fromCharCode(65 + j) : undefined,
        },
        chains: group.length > 1 && j < group.length - 1,
      })
    })
    i += group.length
  }
  return items
}

// ─── fila de planilla ────────────────────────────────────────────────────────

function SheetRow({
  item,
  expanded,
  onToggle,
}: {
  item: SheetItem
  expanded: boolean
  onToggle: () => void
}) {
  const { ex, label, chains } = item
  const logs = SESSION.logs[ex.name]
  const state = exerciseState(logs)
  const doneSets = logs?.filter((s) => s.status === "done").length ?? 0
  const skipped = logs?.filter((s) => s.status === "skipped").length ?? 0

  const restCell = chains ? "→" : sheet(ex.rest)

  return (
    <li>
      <div
        className={cn(
          "group/row -mx-2 rounded-md px-2 py-3.5 transition-colors hover:bg-white/[0.025]",
          COLS
        )}
      >
        {/* Nº — siempre visible; el estado lo cuenta el color */}
        <span
          className={cn(
            "font-display text-lg leading-none",
            state === "done" && "text-primary",
            state === "in-progress" &&
              "text-foreground underline decoration-primary decoration-2 underline-offset-4",
            state === "pending" && "text-muted-foreground/50"
          )}
        >
          {label.num}
          {label.letter && (
            <span className="ml-0.5 text-[0.7em] text-primary">
              {label.letter}
            </span>
          )}
        </span>

        {/* Ejercicio + estado en texto */}
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
          {state !== "pending" && (
            <span
              className={cn(
                "mt-0.5 block font-mono text-[10px] tracking-[0.14em] uppercase",
                state === "in-progress"
                  ? "text-primary"
                  : "text-muted-foreground/70"
              )}
            >
              {state === "in-progress"
                ? `en curso · ${doneSets}/${ex.sets} series`
                : `✓ completado${skipped ? ` · ${skipped} omitida` : ""}`}
            </span>
          )}
          {/* Stats inline en mobile */}
          <span className="mt-1 block font-mono text-[12px] text-muted-foreground md:hidden">
            {ex.sets} × {sheet(ex.reps)} · RIR {sheet(ex.effort)} ·{" "}
            {chains ? "sin pausa →" : sheet(ex.rest)}
          </span>
        </button>

        {/* Columnas (md+) */}
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
          {restCell}
        </span>

        {/* Acciones */}
        <span className="mt-2 flex items-center justify-end gap-1.5 md:mt-0">
          <Link
            href="/rutina/entrenar"
            aria-label={`Entrenar ${ex.name}`}
            className={cn(
              "flex size-7 items-center justify-center rounded-md border transition-colors",
              state === "in-progress"
                ? "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
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
  const todayDone = logs.filter((s) => s.status === "done")
  const refWeight = todayDone.length
    ? topWeight(todayDone)
    : hist
      ? topWeight(hist.lastWeek)
      : null
  const gain =
    hist && refWeight != null ? refWeight - (topWeight(hist.firstWeek) ?? 0) : null

  const fmt = (sets: { weight?: number; reps?: number }[]) =>
    sets
      .map((s) => (s.weight != null ? `${s.weight}×${s.reps}` : "—"))
      .join("  ·  ")

  return (
    <div className="fade-up mt-1 mb-6 ml-2 space-y-5 border-l border-white/12 pl-5 md:ml-[1.05rem] md:pl-8">
      {/* Series de hoy */}
      <div>
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Hoy
        </p>
        <ul className="mt-2 max-w-md space-y-1.5">
          {logs.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between font-mono text-[13px]"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-muted-foreground/60">S{i + 1}</span>
                {s.status === "done" && (
                  <span className="text-foreground/90">
                    {s.weight} kg × {s.reps}
                    {s.rir != null && (
                      <span className="text-muted-foreground"> · RIR {s.rir}</span>
                    )}
                  </span>
                )}
                {s.status === "skipped" && (
                  <span className="text-muted-foreground italic">omitida</span>
                )}
                {s.status === "pending" && (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </span>
              {s.status !== "pending" && (
                <span className="flex items-center gap-1 text-muted-foreground/50">
                  {s.status === "done" && (
                    <span className="mr-1 text-primary">✓</span>
                  )}
                  <button
                    type="button"
                    aria-label={`Resetear serie ${i + 1}`}
                    className="cursor-pointer p-0.5 transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="size-3" />
                  </button>
                  {s.status === "done" && (
                    <button
                      type="button"
                      aria-label={`Marcar serie ${i + 1} como no hecha`}
                      className="cursor-pointer p-0.5 transition-colors hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Comparación */}
      {hist && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            Comparación
          </p>
          <dl className="mt-2 max-w-md space-y-1.5 font-mono text-[13px]">
            {todayDone.length > 0 && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-primary">hoy</dt>
                <dd className="text-right text-foreground/90">
                  {fmt(todayDone)}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">sem. anterior</dt>
              <dd className="text-right text-foreground/65">
                {fmt(hist.lastWeek)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">semana 1</dt>
              <dd className="text-right text-foreground/65">
                {fmt(hist.firstWeek)}
              </dd>
            </div>
          </dl>
          {gain != null && gain > 0 && (
            <p className="mt-2.5 font-mono text-[12px] text-primary">
              ↑ +{gain} kg desde la semana 1
            </p>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.16em] uppercase">
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

  const hasSuperset = items.some((it) => it.label.letter)
  const hasFallo = day.exercises.some((e) => e.effort.includes("fallo"))

  const toggle = (name: string) =>
    setExpanded((cur) => (cur === name ? null : name))

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
        {hasSuperset && (
          <p>
            <span className="mr-2 text-primary/80">A·B</span>
            Superserie — los dos seguidos, sin pausa; el descanso (
            {sheet(items.find((it) => it.chains)?.ex.rest ?? "")}) corre al
            cerrar cada vuelta.
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

import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  History,
  RotateCcw,
  Timer,
  TrendingUp,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Entrenando · FitFront",
}

// ⚠️ Pantalla VISUAL (mock estático): muestra el ejercicio en curso de la
// sesión hardcodeada (Peso Muerto Rumano, serie 2 de 3). La interactividad
// real llega con el backend.

const EXERCISE = {
  order: 2,
  total: 6,
  name: "Peso Muerto Rumano",
  day: "Día 1 · Pierna",
  target: { sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "4'" },
  sets: [
    { n: 1, weight: 70, reps: 12, rir: 1, status: "done" as const },
    { n: 2, status: "active" as const },
    { n: 3, status: "pending" as const },
  ],
  lastWeek: [
    { weight: 67.5, reps: 12 },
    { weight: 67.5, reps: 11 },
    { weight: 67.5, reps: 10 },
  ],
  firstWeek: [
    { weight: 60, reps: 12 },
    { weight: 60, reps: 11 },
    { weight: 60, reps: 10 },
  ],
}

// Estado de los 6 ejercicios del día, para la barra de progreso superior.
const DAY_PROGRESS: ("done" | "current" | "pending")[] = [
  "done",
  "current",
  "pending",
  "pending",
  "pending",
  "pending",
]

function ValueBox({
  label,
  value,
  hint,
}: {
  label: string
  value?: string
  hint?: string
}) {
  return (
    <div className="flex-1 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-3 text-center">
      <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl leading-none",
          value ? "text-foreground" : "text-muted-foreground/30"
        )}
      >
        {value ?? "—"}
      </p>
      {hint && (
        <p className="mt-1 text-[10px] text-muted-foreground/60">{hint}</p>
      )}
    </div>
  )
}

export default function EntrenarPage() {
  const fmt = (sets: { weight: number; reps: number }[]) =>
    sets.map((s) => `${s.weight}×${s.reps}`).join("  ·  ")

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-4 pb-8">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <Link
          href="/rutina"
          className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Rutina
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
          {EXERCISE.day}
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {String(EXERCISE.order).padStart(2, "0")}/
          {String(EXERCISE.total).padStart(2, "0")}
        </span>
      </div>

      {/* Progreso del día (segmentos) */}
      <div className="mt-4 flex gap-1.5">
        {DAY_PROGRESS.map((s, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              s === "done" && "bg-primary",
              s === "current" &&
                "bg-primary/50 shadow-[0_0_10px_-1px] shadow-primary/50",
              s === "pending" && "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Título del ejercicio */}
      <div className="fade-up mt-7">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
          Ejercicio {String(EXERCISE.order).padStart(2, "0")}
        </p>
        <h1 className="mt-1.5 font-display text-4xl leading-[0.95] uppercase sm:text-5xl">
          {EXERCISE.name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span className="font-mono">
            {EXERCISE.target.sets} × {EXERCISE.target.reps}
          </span>
          <span>RIR {EXERCISE.target.effort}</span>
          <span className="flex items-center gap-1">
            <Timer className="size-3.5" />
            Descanso {EXERCISE.target.rest}
          </span>
        </div>
      </div>

      {/* Serie activa */}
      <div className="fade-up mt-6 rounded-2xl bg-card p-5 ring-1 ring-primary/40 shadow-[0_0_36px_-12px] shadow-primary/40 [--delay:100ms]">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
            Serie 2 de 3
          </p>
          <p className="text-[11px] text-muted-foreground">
            Anterior:{" "}
            <span className="font-mono text-foreground/80">70 kg × 12</span>
          </p>
        </div>
        <div className="mt-4 flex gap-2.5">
          <ValueBox label="Peso (kg)" value="70" hint="= serie 1" />
          <ValueBox label="Reps" />
          <ValueBox label="RIR" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button className="h-12 flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase shadow-[0_8px_30px_-8px] shadow-primary/50">
            <Check className="size-4" />
            Completar serie
          </Button>
          <Button
            variant="outline"
            className="h-12 px-4 text-[12px] font-semibold tracking-[0.1em] text-muted-foreground uppercase"
          >
            <X className="size-4" />
            Omitir
          </Button>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
          Al completar arranca el descanso de {EXERCISE.target.rest}
        </p>
      </div>

      {/* Series del ejercicio */}
      <div className="fade-up mt-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 [--delay:180ms]">
        <p className="px-1 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Series
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {EXERCISE.sets.map((s) => (
            <li
              key={s.n}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5",
                s.status === "done" && "bg-white/[0.04]",
                s.status === "active" &&
                  "bg-primary/8 ring-1 ring-primary/30",
                s.status === "pending" &&
                  "border border-dashed border-white/10"
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-display text-sm",
                    s.status === "active" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  S{s.n}
                </span>
                {s.status === "done" && (
                  <span className="font-mono text-[13px] text-foreground/90">
                    {s.weight} kg × {s.reps}
                    <span className="text-muted-foreground"> · RIR {s.rir}</span>
                  </span>
                )}
                {s.status === "active" && (
                  <span className="text-xs font-semibold text-primary">
                    En curso
                  </span>
                )}
                {s.status === "pending" && (
                  <span className="text-xs text-muted-foreground/60">
                    Pendiente
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                {s.status === "done" && (
                  <>
                    <Check className="size-3.5 text-primary" />
                    <button
                      type="button"
                      aria-label={`Resetear serie ${s.n}`}
                      className="cursor-pointer rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Marcar serie ${s.n} como no hecha`}
                      className="cursor-pointer rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Comparación */}
      <div className="fade-up mt-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 [--delay:260ms]">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          <History className="size-3" />
          Comparación
        </p>
        <dl className="mt-3 space-y-2 font-mono text-[12px]">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-primary">Hoy</dt>
            <dd className="text-right text-foreground/90">70×12 · — · —</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">Sem. anterior</dt>
            <dd className="text-right text-foreground/70">
              {fmt(EXERCISE.lastWeek)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">Semana 1</dt>
            <dd className="text-right text-foreground/70">
              {fmt(EXERCISE.firstWeek)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <TrendingUp className="size-3" />
          +10 kg desde la Semana 1
        </p>
      </div>

      {/* Navegación entre ejercicios + reset */}
      <div className="fade-up mt-6 [--delay:340ms]">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/rutina/entrenar"
            className="group inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="truncate">
              Hip Thrust
              <span className="ml-1.5 text-[10px] tracking-wider text-primary uppercase">
                ✓
              </span>
            </span>
          </Link>
          <Link
            href="/rutina/entrenar"
            className="group inline-flex min-w-0 items-center gap-2 text-right text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="truncate">Prensa 45°</span>
            <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-5 text-center">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] tracking-wider text-muted-foreground/60 uppercase transition-colors hover:text-destructive"
          >
            <RotateCcw className="size-3" />
            Reiniciar ejercicio
          </button>
        </div>
      </div>
    </main>
  )
}

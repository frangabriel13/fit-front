"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { ProgressionRail } from "@/components/routine/progression-rail"
import { ActionBar } from "@/components/routine/entrenar/action-bar"
import { CompareStrip } from "@/components/routine/entrenar/compare-strip"
import { Disclosure } from "@/components/routine/entrenar/disclosure"
import { ExerciseHeader } from "@/components/routine/entrenar/exercise-header"
import { ExerciseNav } from "@/components/routine/entrenar/exercise-nav"
import { RirScale } from "@/components/routine/entrenar/rir-scale"
import { SessionRail } from "@/components/routine/entrenar/session-rail"
import { SetMatrix } from "@/components/routine/entrenar/set-matrix"
import { StepBar } from "@/components/routine/entrenar/step-bar"
import { ValueTile } from "@/components/routine/entrenar/value-tile"
import type { EntriesLookup, Slot } from "@/components/routine/entrenar/slots"
import { useTrainingSession } from "@/hooks/use-training-session"
import type { PlanDay } from "@/lib/plan"
import { trainHref } from "@/lib/routes"
import type { ExerciseHistory, WorkoutSession } from "@/types/api"

// Pantalla de entrenamiento en el esquema "tablero": la comparación contra la
// semana anterior vive siempre a la vista, el 1RM estimado se recalcula
// mientras cargás, y un único stepper apunta a la celda que tocaste (peso o
// reps) para dejar lugar a números grandes.
//
// Código de color "monocromo filo": el CYAN (--primary) es el único que colorea,
// y marca DÓNDE ESTÁS AHORA — la celda que cargás, el RIR elegido, la serie en
// curso, el botón. Lo hecho baja a neutro y el ámbar no se usa acá. Ningún
// estado se apoya en la opacidad: un tinte al 5% sobre este fondo no se lee como
// estado, se lee como mancha. Lo hacen el RELLENO (donde cargás) y el BORDE (lo
// que acompaña), sobre la escala opaca de globals.css.
//
// Este archivo es SOLO composición: el estado vive en `use-training-session`
// (que además persiste contra la API) y cada pieza en esta misma carpeta.
//
// Se monta con `key` por slot: cambiar de ejercicio es una navegación, y
// remontar deja el estado limpio en vez de arrastrar el del ejercicio anterior.
export function TrainingScreen({
  day,
  slots,
  slotIdx,
  session,
  sessionId,
  history,
  week,
  totalWeeks,
  entriesOf,
}: {
  day: PlanDay
  slots: Slot[]
  slotIdx: number
  session: WorkoutSession | undefined
  sessionId: string | null
  history: Record<string, ExerciseHistory>
  week: number
  totalWeeks: number
  entriesOf: EntriesLookup
}) {
  const router = useRouter()
  const slot = slots[slotIdx]
  const members = slot.items
  const isSuper = members.length > 1
  const unit = isSuper ? "vuelta" : "serie"

  const s = useTrainingSession({
    members,
    session,
    sessionId,
    dayId: day.id,
    history,
  })
  const ex = s.exercise

  const prev = slots[slotIdx - 1]
  const next = slots[slotIdx + 1]
  const hrefFor = (target?: Slot) =>
    target ? trainHref(day.id, target.items[0].ex.id) : "/rutina"

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
        <Eyebrow
          as="p"
          size="lg"
          className="justify-self-center font-semibold whitespace-nowrap text-muted-foreground"
        >
          Día {String(day.order).padStart(2, "0")} — {day.name}
        </Eyebrow>
        <span className="justify-self-end font-mono text-[11px] tabular-nums text-faint">
          {slot.num}/{String(slots.length).padStart(2, "0")}
        </span>
      </div>

      {/* La API deja seguir cargando series en un día cerrado —sirve para
          corregir— pero sin este aviso nada delata que ya está terminado, y lo
          que se cargue después cuenta como definitivo. */}
      {s.sessionClosed && (
        <div className="fade-up mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-primary/25 bg-primary/10 px-3.5 py-2.5">
          <Eyebrow tone="meta" className="flex items-center gap-2 text-primary">
            <Check className="size-3.5" />
            Día terminado
          </Eyebrow>
          <button
            type="button"
            onClick={s.reopen}
            disabled={s.finishing}
            className="cursor-pointer font-mono text-[10px] font-semibold tracking-[0.16em] text-primary uppercase underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-40"
          >
            Reabrir
          </button>
        </div>
      )}

      <SessionRail
        slots={slots}
        activeIndex={slotIdx}
        activeState={s.slotState}
        entriesOf={entriesOf}
      />

      <ExerciseHeader
        slotNum={slot.num}
        members={members}
        activeIndex={s.cursor.member}
        rounds={s.rounds}
      />

      <CompareStrip
        refSet={s.refSet}
        refWeek={s.refWeek}
        refE1rm={s.refE1rm}
        liveE1rm={s.liveE1rm}
        e1rmDelta={s.e1rmDelta}
        draft={s.draft}
        unit={unit}
        round={s.cursor.round}
        rounds={s.rounds}
        memberLetter={isSuper ? s.activeMember.letter : undefined}
        onMatch={s.matchReference}
      />

      {/* Editor: dos celdas grandes + un solo stepper apuntado a la enfocada */}
      <section className="fade-up mt-3 [--delay:120ms]">
        <div className="grid grid-cols-2 gap-2.5">
          <ValueTile
            label="Peso · kg"
            value={s.draft.weight}
            active={s.field === "weight"}
            inputMode="decimal"
            onFocus={() => s.focus("weight")}
            onInput={s.setWeight}
          />
          <ValueTile
            label={`Reps · meta ${ex.reps}`}
            value={s.draft.reps}
            active={s.field === "reps"}
            inputMode="numeric"
            onFocus={() => s.focus("reps")}
            onInput={s.setReps}
          />
        </div>

        <StepBar
          field={s.field}
          step={s.step}
          canDec={s.canDec}
          onStep={s.setStep}
          onInc={() => s.bump(1)}
          onDec={() => s.bump(-1)}
        />

        <RirScale value={s.draftRir} onPick={s.setRir} />
      </section>

      <SetMatrix
        unitStatuses={s.unitStatuses}
        members={members}
        memberLogs={s.memberLogs}
        currentRound={s.cursor.round}
        unit={unit}
        onGoTo={s.goToRound}
        onReset={s.resetRound}
        onOmit={s.omitRound}
      />

      {/* Progresión del macrociclo — secundaria, plegable */}
      {history[ex.name] && (
        <div className="mt-5">
          <Disclosure
            eyebrow="Progresión"
            delay="240ms"
            meta={
              <Eyebrow tone="meta" className="text-faint">
                top set
              </Eyebrow>
            }
          >
            <ProgressionRail
              history={history[ex.name]}
              week={week}
              totalWeeks={totalWeeks}
              today={{
                sets: s.memberLogs[s.cursor.member],
                closed: s.sessionClosed,
              }}
            />
          </Disclosure>
        </div>
      )}

      <ExerciseNav
        prev={prev}
        prevHref={hrefFor(prev)}
        next={next}
        nextHref={hrefFor(next)}
        entriesOf={entriesOf}
        onReset={s.resetExercise}
      />

      <ActionBar
        resting={s.resting}
        allClosed={s.allClosed}
        restSeconds={ex.restSeconds}
        unit={unit}
        canComplete={s.canComplete}
        next={next}
        nextHref={hrefFor(next)}
        finishing={s.finishing}
        onComplete={s.completeUnit}
        onSkip={s.skipUnit}
        onReset={s.resetExercise}
        onRestEnd={s.endRest}
        onFinish={async () => {
          // Solo se sale si el cierre entró: irse dando por terminado algo que
          // quedó abierto es peor que quedarse en la pantalla con el error.
          if (await s.finish()) router.push("/rutina")
        }}
      />
    </main>
  )
}

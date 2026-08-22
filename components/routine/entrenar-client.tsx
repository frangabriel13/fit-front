"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { ProgressionRail } from "@/components/routine/progression-rail"
import { sheet, toSheetItems } from "@/lib/sheet"
import { ActionBar } from "@/components/routine/entrenar/action-bar"
import { CompareStrip } from "@/components/routine/entrenar/compare-strip"
import { Disclosure } from "@/components/routine/entrenar/disclosure"
import { ExerciseHeader } from "@/components/routine/entrenar/exercise-header"
import { ExerciseNav } from "@/components/routine/entrenar/exercise-nav"
import { RirScale } from "@/components/routine/entrenar/rir-scale"
import { SessionRail } from "@/components/routine/entrenar/session-rail"
import { SetMatrix } from "@/components/routine/entrenar/set-matrix"
import { StepBar } from "@/components/routine/entrenar/step-bar"
import { toSlots } from "@/components/routine/entrenar/slots"
import { ValueTile } from "@/components/routine/entrenar/value-tile"
import { useTrainingSession } from "@/hooks/use-training-session"
import { HISTORY, ROUTINE, WORKOUT_POSITION } from "@/lib/routine-data"

// Pantalla de entrenamiento INTERACTIVA con estado local (sin backend), en el
// esquema "tablero": la comparación contra la semana anterior vive siempre a la
// vista, el 1RM estimado se recalcula mientras cargás, y un único stepper apunta
// a la celda que tocaste (peso o reps) para dejar lugar a números grandes.
//
// Código de color "monocromo filo": el CYAN (--primary) es el único que colorea,
// y marca DÓNDE ESTÁS AHORA — la celda que cargás, el RIR elegido, la serie en
// curso, el botón. Lo hecho baja a neutro y el ámbar no se usa acá. Ningún
// estado se apoya en la opacidad: un tinte al 5% sobre este fondo no se lee como
// estado, se lee como mancha. Lo hacen el RELLENO (donde cargás) y el BORDE (lo
// que acompaña), sobre la escala opaca de globals.css.
//
// Este archivo es SOLO composición: el estado vive en `use-training-session` y
// cada pieza en `components/routine/entrenar/`.
//
// Deriva el plan de ROUTINE + WORKOUT_POSITION; cambiá
// WORKOUT_POSITION.exerciseName para previsualizar la variante biserie.

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
  const unit = isSuper ? "vuelta" : "serie"

  const s = useTrainingSession(members)
  const ex = s.exercise

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

      <SessionRail
        slots={slots}
        activeIndex={slotIdx}
        activeState={s.slotState}
      />

      <ExerciseHeader
        slotNum={slot.num}
        members={members}
        activeIndex={s.cursor.member}
        rounds={s.rounds}
      />

      <CompareStrip
        refSet={s.refSet}
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
            label={`Reps · meta ${sheet(ex.reps)}`}
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
      {HISTORY[ex.name] && (
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
            <ProgressionRail name={ex.name} />
          </Disclosure>
        </div>
      )}

      <ExerciseNav
        prev={slots[slotIdx - 1]}
        next={slots[slotIdx + 1]}
        onReset={s.resetExercise}
      />

      <ActionBar
        resting={s.resting}
        allClosed={s.allClosed}
        rest={ex.rest}
        unit={unit}
        canComplete={s.canComplete}
        next={slots[slotIdx + 1]}
        onComplete={s.completeUnit}
        onSkip={s.skipUnit}
        onReset={s.resetExercise}
        onRestEnd={s.endRest}
      />
    </main>
  )
}

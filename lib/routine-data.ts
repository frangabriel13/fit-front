import type { HistSet, SetEntry } from "@/lib/training-math"

// ⚠️ Rutina HARDCODEADA (placeholder).
// El Día 1 (Pierna) es la rutina real de Diamela.
// Los días 2-4 son de ejemplo para editar luego.
// La sesión en curso y el historial también son mock (sin backend).
// Reemplazar por datos de la API cuando exista el backend.

export type { ExerciseState, HistSet, SetEntry, SetStatus } from "@/lib/training-math"

export interface RoutineExercise {
  name: string
  sets: number
  reps: string
  /** RIR / RPE objetivo. */
  effort: string
  /** Descanso entre series. */
  rest: string
  /** Id de superserie: ejercicios consecutivos con el mismo id van enlazados. */
  superset?: string
}

export interface RoutineDay {
  id: string
  order: number
  name: string
  focus: string
  /** Marca los días de ejemplo (los que el usuario va a editar). */
  placeholder?: boolean
  exercises: RoutineExercise[]
}

export const ROUTINE: {
  name: string
  cycle: string
  days: RoutineDay[]
} = {
  name: "Rutina de Diamela",
  cycle: "Microciclo 1",
  days: [
    {
      id: "d1",
      order: 1,
      name: "Pierna",
      focus: "Glúteo · Cuádriceps · Femoral",
      exercises: [
        { name: "Hip Thrust", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "4'" },
        { name: "Peso Muerto Rumano", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "4'" },
        { name: "Prensa 45°", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "4'" },
        {
          name: "Abducciones en máquina",
          sets: 3,
          reps: "10 a 15",
          effort: "0 o fallo",
          rest: "3'",
          superset: "ss1",
        },
        {
          name: "Adducciones en máquina",
          sets: 3,
          reps: "10 a 15",
          effort: "0 o fallo",
          rest: "3'",
          superset: "ss1",
        },
        {
          name: "Extensión de cuádriceps",
          sets: 3,
          reps: "10 a 12",
          effort: "0 o fallo",
          rest: "3'",
        },
      ],
    },
    {
      id: "d2",
      order: 2,
      name: "Empuje",
      focus: "Pecho · Hombro · Tríceps",
      placeholder: true,
      exercises: [
        { name: "Press de banca", sets: 4, reps: "8 a 10", effort: "2 a 1", rest: "3'" },
        { name: "Press militar con mancuernas", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "3'" },
        { name: "Press inclinado en máquina", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "2'" },
        { name: "Aperturas en polea", sets: 3, reps: "12 a 15", effort: "0 o fallo", rest: "2'" },
        { name: "Elevaciones laterales", sets: 4, reps: "12 a 15", effort: "0 o fallo", rest: "90''" },
        { name: "Extensión de tríceps en polea", sets: 3, reps: "10 a 15", effort: "0 o fallo", rest: "90''" },
      ],
    },
    {
      id: "d3",
      order: 3,
      name: "Tirón",
      focus: "Espalda · Bíceps",
      placeholder: true,
      exercises: [
        { name: "Jalón al pecho", sets: 4, reps: "8 a 10", effort: "2 a 1", rest: "3'" },
        { name: "Remo en máquina", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "3'" },
        { name: "Remo con mancuerna", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "2'" },
        { name: "Face pull", sets: 3, reps: "12 a 15", effort: "0 o fallo", rest: "90''" },
        { name: "Curl de bíceps con barra", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "2'" },
        { name: "Curl martillo", sets: 3, reps: "10 a 15", effort: "0 o fallo", rest: "90''" },
      ],
    },
    {
      id: "d4",
      order: 4,
      name: "Glúteo",
      focus: "Glúteo · Femoral",
      placeholder: true,
      exercises: [
        { name: "Hip Thrust", sets: 4, reps: "8 a 10", effort: "2 a 1", rest: "4'" },
        { name: "Sentadilla búlgara", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "3'" },
        {
          name: "Patada de glúteo en polea",
          sets: 3,
          reps: "12 a 15",
          effort: "0 o fallo",
          rest: "2'",
          superset: "ss1",
        },
        {
          name: "Abducción en máquina",
          sets: 3,
          reps: "12 a 15",
          effort: "0 o fallo",
          rest: "2'",
          superset: "ss1",
        },
        { name: "Peso Muerto Rumano", sets: 3, reps: "10 a 12", effort: "1 a 0", rest: "3'" },
        { name: "Puente de glúteo", sets: 3, reps: "12 a 15", effort: "0 o fallo", rest: "90''" },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sesión en curso + historial (mock) — para diseñar anotaciones y comparación
// ─────────────────────────────────────────────────────────────────────────────

/** Registros de la sesión de hoy, por nombre de ejercicio. Solo Día 1. */
export const SESSION: {
  dayId: string
  label: string
  logs: Record<string, SetEntry[]>
} = {
  dayId: "d1",
  label: "Hoy · empezado 18:40",
  logs: {
    "Hip Thrust": [
      { weight: 60, reps: 12, rir: 1, status: "done" },
      { weight: 60, reps: 11, rir: 1, status: "done" },
      { status: "skipped" },
    ],
    "Peso Muerto Rumano": [
      { weight: 70, reps: 12, rir: 1, status: "done" },
      { status: "pending" },
      { status: "pending" },
    ],
  },
}

/**
 * Historial por ejercicio: una entrada por semana COMPLETADA del macrociclo
 * (índice 0 = Semana 1). La semana en curso no vive acá — sale de SESSION.
 */
export const HISTORY: Record<string, { weeks: HistSet[][] }> = {
  "Hip Thrust": {
    weeks: [
      [
        { weight: 50, reps: 12, rir: 2 },
        { weight: 50, reps: 10, rir: 1 },
        { weight: 50, reps: 10, rir: 1 },
      ],
      [
        { weight: 52.5, reps: 12, rir: 2 },
        { weight: 52.5, reps: 11, rir: 1 },
        { weight: 52.5, reps: 10, rir: 1 },
      ],
      [
        { weight: 55, reps: 12, rir: 1 },
        { weight: 55, reps: 11, rir: 1 },
        { weight: 55, reps: 10, rir: 0 },
      ],
      [
        { weight: 57.5, reps: 12, rir: 1 },
        { weight: 57.5, reps: 11, rir: 1 },
        { weight: 57.5, reps: 10, rir: 0 },
      ],
    ],
  },
  "Peso Muerto Rumano": {
    weeks: [
      [
        { weight: 60, reps: 12, rir: 2 },
        { weight: 60, reps: 11, rir: 1 },
        { weight: 60, reps: 10, rir: 1 },
      ],
      [
        { weight: 62.5, reps: 12, rir: 1 },
        { weight: 62.5, reps: 11, rir: 1 },
        { weight: 62.5, reps: 10, rir: 1 },
      ],
      [
        { weight: 65, reps: 12, rir: 1 },
        { weight: 65, reps: 11, rir: 1 },
        { weight: 65, reps: 10, rir: 0 },
      ],
      [
        { weight: 67.5, reps: 12, rir: 1 },
        { weight: 67.5, reps: 11, rir: 1 },
        { weight: 67.5, reps: 10, rir: 0 },
      ],
    ],
  },
  "Prensa 45°": {
    weeks: [
      [
        { weight: 100, reps: 12, rir: 2 },
        { weight: 100, reps: 10, rir: 1 },
        { weight: 100, reps: 10, rir: 1 },
      ],
      [
        { weight: 105, reps: 12, rir: 1 },
        { weight: 105, reps: 11, rir: 1 },
        { weight: 105, reps: 10, rir: 1 },
      ],
      [
        { weight: 110, reps: 12, rir: 1 },
        { weight: 110, reps: 11, rir: 1 },
        { weight: 110, reps: 10, rir: 0 },
      ],
      [
        { weight: 115, reps: 12, rir: 1 },
        { weight: 115, reps: 11, rir: 1 },
        { weight: 115, reps: 10, rir: 0 },
      ],
    ],
  },
  "Abducciones en máquina": {
    weeks: [
      [
        { weight: 35, reps: 15, rir: 1 },
        { weight: 35, reps: 12, rir: 1 },
        { weight: 35, reps: 11, rir: 0 },
      ],
      [
        { weight: 40, reps: 15, rir: 1 },
        { weight: 40, reps: 13, rir: 0 },
        { weight: 40, reps: 12, rir: 0 },
      ],
      [
        { weight: 42.5, reps: 15, rir: 0 },
        { weight: 42.5, reps: 13, rir: 0 },
        { weight: 42.5, reps: 12, rir: 0 },
      ],
      [
        { weight: 45, reps: 15, rir: 0 },
        { weight: 45, reps: 13, rir: 0 },
        { weight: 45, reps: 12, rir: 0 },
      ],
    ],
  },
  "Adducciones en máquina": {
    weeks: [
      [
        { weight: 30, reps: 15, rir: 1 },
        { weight: 30, reps: 13, rir: 1 },
        { weight: 30, reps: 12, rir: 0 },
      ],
      [
        { weight: 35, reps: 15, rir: 0 },
        { weight: 35, reps: 14, rir: 0 },
        { weight: 35, reps: 12, rir: 0 },
      ],
      [
        { weight: 37.5, reps: 15, rir: 0 },
        { weight: 37.5, reps: 14, rir: 0 },
        { weight: 37.5, reps: 12, rir: 0 },
      ],
      [
        { weight: 40, reps: 15, rir: 0 },
        { weight: 40, reps: 14, rir: 0 },
        { weight: 40, reps: 12, rir: 0 },
      ],
    ],
  },
  "Extensión de cuádriceps": {
    weeks: [
      [
        { weight: 25, reps: 12, rir: 1 },
        { weight: 25, reps: 11, rir: 1 },
        { weight: 25, reps: 10, rir: 0 },
      ],
      [
        { weight: 27.5, reps: 12, rir: 0 },
        { weight: 27.5, reps: 11, rir: 0 },
        { weight: 27.5, reps: 10, rir: 0 },
      ],
      [
        { weight: 30, reps: 12, rir: 0 },
        { weight: 30, reps: 11, rir: 0 },
        { weight: 30, reps: 10, rir: 0 },
      ],
      [
        { weight: 32.5, reps: 12, rir: 0 },
        { weight: 32.5, reps: 11, rir: 0 },
        { weight: 32.5, reps: 10, rir: 0 },
      ],
    ],
  },
}

/**
 * Posición dentro del macrociclo (mock). `week` debe ser una más que la última
 * semana cargada en HISTORY: las semanas 1..(week-1) están completas y la
 * semana `week` es la de hoy (en curso, vía SESSION).
 */
export const MACROCYCLE = { week: 5, totalWeeks: 6 }

/**
 * Puntero del modo entrenamiento (mock). Cambiá exerciseName para
 * previsualizar otra variante (ej. "Abducciones en máquina" → biserie).
 */
export const WORKOUT_POSITION = {
  dayId: "d1",
  exerciseName: "Peso Muerto Rumano",
}

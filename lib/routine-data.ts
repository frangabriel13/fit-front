// ⚠️ Rutina HARDCODEADA (placeholder).
// El Día 1 (Pierna) es la rutina real de Diamela.
// Los días 2-4 son de ejemplo para editar luego.
// La sesión en curso y el historial también son mock (sin backend).
// Reemplazar por datos de la API cuando exista el backend.

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

export type SetStatus = "done" | "skipped" | "pending"

export interface SetEntry {
  weight?: number
  reps?: number
  rir?: number
  status: SetStatus
}

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

export interface HistSet {
  weight: number
  reps: number
}

/** Historial por ejercicio: semana pasada y Semana 1 del macrociclo (6 sem). */
export const HISTORY: Record<
  string,
  { lastWeek: HistSet[]; firstWeek: HistSet[] }
> = {
  "Hip Thrust": {
    lastWeek: [
      { weight: 57.5, reps: 12 },
      { weight: 57.5, reps: 11 },
      { weight: 57.5, reps: 10 },
    ],
    firstWeek: [
      { weight: 50, reps: 12 },
      { weight: 50, reps: 10 },
      { weight: 50, reps: 10 },
    ],
  },
  "Peso Muerto Rumano": {
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
  },
  "Prensa 45°": {
    lastWeek: [
      { weight: 115, reps: 12 },
      { weight: 115, reps: 11 },
      { weight: 115, reps: 10 },
    ],
    firstWeek: [
      { weight: 100, reps: 12 },
      { weight: 100, reps: 10 },
      { weight: 100, reps: 10 },
    ],
  },
  "Abducciones en máquina": {
    lastWeek: [
      { weight: 45, reps: 15 },
      { weight: 45, reps: 13 },
      { weight: 45, reps: 12 },
    ],
    firstWeek: [
      { weight: 35, reps: 15 },
      { weight: 35, reps: 12 },
      { weight: 35, reps: 11 },
    ],
  },
  "Adducciones en máquina": {
    lastWeek: [
      { weight: 40, reps: 15 },
      { weight: 40, reps: 14 },
      { weight: 40, reps: 12 },
    ],
    firstWeek: [
      { weight: 30, reps: 15 },
      { weight: 30, reps: 13 },
      { weight: 30, reps: 12 },
    ],
  },
  "Extensión de cuádriceps": {
    lastWeek: [
      { weight: 32.5, reps: 12 },
      { weight: 32.5, reps: 11 },
      { weight: 32.5, reps: 10 },
    ],
    firstWeek: [
      { weight: 25, reps: 12 },
      { weight: 25, reps: 11 },
      { weight: 25, reps: 10 },
    ],
  },
}

/** Posición dentro del macrociclo (mock). */
export const MACROCYCLE = { week: 2, totalWeeks: 6 }

// ── Helpers de estado/tendencia ──────────────────────────────────────────────

export type ExerciseState = "pending" | "in-progress" | "done"

export function exerciseState(sets?: SetEntry[]): ExerciseState {
  if (!sets || sets.every((s) => s.status === "pending")) return "pending"
  if (sets.every((s) => s.status !== "pending")) return "done"
  return "in-progress"
}

export function topWeight(sets: { weight?: number }[]): number | null {
  const ws = sets.map((s) => s.weight).filter((w): w is number => w != null)
  return ws.length ? Math.max(...ws) : null
}

/** Tendencia compacta: hoy vs semana pasada; si no empezó, último peso usado. */
export function exerciseTrend(name: string): {
  label: string
  delta: number | null
} {
  const hist = HISTORY[name]
  if (!hist) return { label: "—", delta: null }
  const last = topWeight(hist.lastWeek)
  const today = topWeight(SESSION.logs[name] ?? [])
  if (today != null && last != null) {
    return { label: `${today} kg`, delta: today - last }
  }
  return { label: last != null ? `últ. ${last} kg` : "—", delta: null }
}

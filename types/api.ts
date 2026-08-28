// Tipos que matchean el contrato de la API REST de NestJS.

export type UserRole = "trainer" | "client"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface DayExercise {
  id: string
  name: string
  order: number
  targetSets: number
  targetRestSeconds?: number | null
  targetRir?: number | null
  notes?: string | null
  /** Objetivo de reps como rango: 10 a 12. Iguales = número fijo. */
  targetRepsMin?: number | null
  targetRepsMax?: number | null
  /** Objetivo de esfuerzo como rango de RIR. */
  targetRirMin?: number | null
  targetRirMax?: number | null
  /** Al fallo: reemplaza (o cierra) el rango de RIR. */
  toFailure?: boolean
  /** Agrupa ejercicios encadenados: mismo valor = superserie (04A + 04B). */
  supersetGroup?: string | null
}

export interface Day {
  id: string
  name: string
  order: number
  focus?: string | null
  exercises: DayExercise[]
}

export interface Microcycle {
  id: string
  name: string
  order: number
  days: Day[]
}

export interface Split {
  id: string
  name: string
  description?: string | null
  microcycles: Microcycle[]
}

export interface SetLog {
  id: string
  dayExerciseId: string
  setNumber: number
  actualReps?: number | null
  actualRir?: number | null
  weight?: number | null
  completed: boolean
  /** Serie omitida a propósito. Distinta de "pendiente": ya se decidió. */
  skipped?: boolean
}

export interface WorkoutSession {
  id: string
  dayId: string
  performedAt: string
  notes?: string | null
  setLogs: SetLog[]
}

// ---- Respuestas de auth ----

export interface LoginResponse {
  accessToken: string
  user: User
}

// ---- Payloads de request ----

export interface LoginPayload {
  email: string
  password: string
}

export interface SplitPayload {
  name: string
  description?: string
}

export interface MicrocyclePayload {
  name: string
  order: number
}

export interface DayPayload {
  name: string
  order: number
}

export interface DayExercisePayload {
  name: string
  order: number
  targetSets: number
  targetRestSeconds?: number
  targetRir?: number
  notes?: string
}

// Upsert en lote de set-logs (PUT /sessions/:id/set-logs).
export interface SetLogUpsert {
  dayExerciseId: string
  setNumber: number
  actualReps?: number
  actualRir?: number
  weight?: number
  completed: boolean
  skipped?: boolean
}

export interface SetLogPatch {
  actualReps?: number
  actualRir?: number
  weight?: number
  completed?: boolean
  skipped?: boolean
}

// ---- Progreso del macrociclo (GET /splits/:id/progress) ----

/** Una serie del historial. Peso y reps siempre presentes; el RIR puede faltar. */
export interface HistorySet {
  weight: number
  reps: number
  rir: number | null
}

export interface ExerciseHistory {
  /** Se correlaciona por NOMBRE entre semanas: cada microciclo tiene sus filas. */
  name: string
  /** Una entrada por semana COMPLETADA, densa desde la 1. La actual no va acá. */
  weeks: HistorySet[][]
}

export interface SplitProgress {
  splitId: string
  /** Semana en curso, 1-based. */
  week: number
  /** Microciclos vivos del macrociclo. */
  totalWeeks: number
  exercises: ExerciseHistory[]
}

// Tipos que matchean el contrato de la API REST de NestJS.

export interface User {
  id: string
  email: string
  name: string
}

export interface DayExercise {
  id: string
  name: string
  order: number
  targetSets: number
  targetRestSeconds?: number | null
  targetRir?: number | null
  notes?: string | null
}

export interface Day {
  id: string
  name: string
  order: number
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
}

export interface SetLogPatch {
  actualReps?: number
  actualRir?: number
  weight?: number
  completed?: boolean
}

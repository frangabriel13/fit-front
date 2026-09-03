// Tipos que matchean el contrato de la API REST de NestJS.

export type UserRole = "trainer" | "client"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  /**
   * La contraseña es la provisoria que puso el entrenador. Nace en `true` con
   * el alta y se apaga sola cuando el propio usuario usa
   * `POST /auth/change-password` — un reset del entrenador la vuelve a prender.
   */
  mustChangePassword: boolean
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

/** A quién está asignada una rutina. Por regla del producto, 0 o 1. */
export interface SplitClient {
  id: string
  name: string
}

export interface Split {
  id: string
  name: string
  description?: string | null
  /**
   * Los clientes con la rutina asignada. La API garantiza que un cliente tiene
   * una sola rutina activa, así que en la práctica es `[]` o un elemento.
   */
  clients: SplitClient[]
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
  /**
   * Cuándo se dio por terminado el entrenamiento (ISO 8601), o `null` si sigue
   * abierto. Lo que está abierto es parcial: no se compara contra eso.
   */
  completedAt: string | null
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

/**
 * Alta de un cliente por su entrenador (`POST /clients`).
 *
 * Sin `role` ni `trainerId`: los pone el servidor. La contraseña es provisoria
 * — el cliente la cambia después con `POST /auth/change-password`.
 */
export interface ClientPayload {
  email: string
  name: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

/**
 * Edición de un cliente por su entrenador (`PATCH /clients/:id`).
 *
 * Campo ausente = no tocar. `password` es el reset del entrenador: pisa la que
 * haya y deja al cliente con `mustChangePassword` en `true` otra vez.
 */
export interface ClientPatch {
  name?: string
  email?: string
  password?: string
}

/** Body de `PATCH /sessions/:id`. `completed` cierra (true) o reabre (false). */
export interface SessionPatch {
  notes?: string
  completed?: boolean
}

export interface SplitPayload {
  name: string
  description?: string
  /**
   * A quién se le asigna. La API la crea (o reactiva) como asignación: mandarlo
   * ASIGNA, nunca desasigna, y omitirlo no toca las asignaciones que ya hay.
   */
  clientId?: string
}

export interface MicrocyclePayload {
  name: string
  order: number
}

export interface DayPayload {
  name: string
  order: number
  /** "Glúteo · Cuádriceps". Lo muestra la planilla debajo del nombre del día. */
  focus?: string
}

/**
 * Sin `targetRir`: en la base no existe como columna. Al leer es un alias de
 * `targetRirMin`, y el PATCH lo descarta — mandarlo no haría nada. El objetivo
 * de esfuerzo se escribe como rango.
 */
export interface DayExercisePayload {
  name: string
  order: number
  targetSets: number
  targetRestSeconds?: number
  notes?: string
  targetRepsMin?: number
  targetRepsMax?: number
  targetRirMin?: number
  targetRirMax?: number
  toFailure?: boolean
  supersetGroup?: string
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

/**
 * Body de `PATCH /set-logs/:id`. Sin consumidor hoy —todo lo que se edita en la
 * planilla va por el upsert en lote—, pero el endpoint existe y esto es el
 * espejo del contrato, no de lo que la app usa.
 */
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

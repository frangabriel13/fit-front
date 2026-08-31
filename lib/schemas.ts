import { z } from "zod"

// Coerción a número que trata "" como undefined (inputs HTML opcionales).
const optionalNumber = z
  .union([z.literal(""), z.coerce.number()])
  .transform((v) => (v === "" ? undefined : v))
  .optional()

const optionalText = z
  .string()
  .max(500, "Máximo 500 caracteres")
  .optional()
  .transform((v) => (v === "" || v == null ? undefined : v))

/** Un rango es válido si falta alguno de los extremos, o si min <= max. */
const rangeOk = (min?: number, max?: number) =>
  min == null || max == null || max >= min

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
})
export type LoginValues = z.infer<typeof loginSchema>

export const splitSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: optionalText,
  // Vacío = no tocar las asignaciones. El <select> usa "" como "sin elegir".
  clientId: optionalText,
})
export type SplitValues = z.infer<typeof splitSchema>

export const microcycleSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  order: z.coerce.number().int().min(0),
})
export type MicrocycleValues = z.infer<typeof microcycleSchema>

export const daySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  order: z.coerce.number().int().min(0),
  focus: optionalText,
})
export type DayValues = z.infer<typeof daySchema>

export const exerciseSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(100),
    order: z.coerce.number().int().min(0),
    targetSets: z.coerce.number().int().min(1, "Mínimo 1 serie"),
    targetRestSeconds: optionalNumber,
    notes: optionalText,
    // Objetivos como rango: es como se pauta y como se lee la planilla.
    targetRepsMin: optionalNumber,
    targetRepsMax: optionalNumber,
    targetRirMin: optionalNumber,
    targetRirMax: optionalNumber,
    toFailure: z.boolean().optional(),
    /** Misma letra en ejercicios consecutivos = superserie (04A + 04B). */
    supersetGroup: optionalText,
  })
  // Un rango invertido no lo rechaza la API, pero se mostraría al revés.
  .refine((v) => rangeOk(v.targetRepsMin, v.targetRepsMax), {
    message: "El máximo de reps no puede ser menor que el mínimo",
    path: ["targetRepsMax"],
  })
  .refine((v) => rangeOk(v.targetRirMin, v.targetRirMax), {
    message: "El RIR máximo no puede ser menor que el mínimo",
    path: ["targetRirMax"],
  })
export type ExerciseValues = z.infer<typeof exerciseSchema>

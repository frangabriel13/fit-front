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
})
export type DayValues = z.infer<typeof daySchema>

export const exerciseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  order: z.coerce.number().int().min(0),
  targetSets: z.coerce.number().int().min(1, "Mínimo 1 serie"),
  targetRestSeconds: optionalNumber,
  targetRir: optionalNumber,
  notes: optionalText,
})
export type ExerciseValues = z.infer<typeof exerciseSchema>

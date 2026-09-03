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

/**
 * Alta de un cliente. Los límites son los mismos que valida la API
 * (`CreateClientDto`): repetirlos acá evita un viaje para enterarse.
 */
export const clientSchema = z.object({
  email: z.email("Email inválido").max(200),
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(200, "Máximo 200 caracteres"),
})
export type ClientValues = z.infer<typeof clientSchema>

/**
 * Edición de un cliente. Mismos campos que el alta pero la contraseña es
 * opcional: vacía significa "no la toques". Cargarla es el reset del
 * entrenador, y deja al cliente teniendo que elegir una nueva.
 */
export const clientEditSchema = clientSchema.extend({
  /**
   * Vacía = no tocar la contraseña. Sin `transform`: que la entrada y la salida
   * sean las dos `string` mantiene simple el tipo del formulario, y traducir el
   * vacío a "no mandar el campo" es trabajo del submit, donde se lee.
   */
  password: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .refine((v) => v === "" || v.length >= 8, "Mínimo 8 caracteres"),
})
export type ClientEditValues = z.infer<typeof clientEditSchema>

/**
 * Cambio de contraseña propio.
 *
 * La confirmación es solo del front —la API pide `currentPassword` y
 * `newPassword`— y existe porque el campo va enmascarado: un error de tipeo
 * dejaría al usuario afuera sin forma de saber qué escribió.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(200, "Máximo 200 caracteres"),
    confirmPassword: z.string().min(1, "Repetí la contraseña nueva"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "La nueva tiene que ser distinta de la actual",
    path: ["newPassword"],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const splitSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: optionalText,
  // Vacío = no tocar las asignaciones. El <select> usa "" como "sin elegir".
  clientId: optionalText,
})
export type SplitValues = z.infer<typeof splitSchema>

/** Asignar una rutina existente a un cliente: solo hace falta cuál. */
export const assignSplitSchema = z.object({
  splitId: z.string().min(1, "Elegí una rutina"),
})
export type AssignSplitValues = z.infer<typeof assignSplitSchema>

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

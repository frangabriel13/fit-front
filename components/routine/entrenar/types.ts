/** El borrador de carga y la celda a la que apunta el stepper compartido. */

/**
 * El borrador guarda strings (no números) para que tipear decimales sea natural
 * —"57.", "1,25"— sin que el input normalice mientras escribís. Se parsea recién
 * al sumar con los botones o al completar la serie.
 */
export interface Draft {
  weight: string
  reps: string
  rir: string
}

/** Qué celda recibe los ± del stepper compartido. */
export type Field = "weight" | "reps"

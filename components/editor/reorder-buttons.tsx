"use client"

import { ChevronDown, ChevronUp } from "lucide-react"

const BUTTON =
  "inline-flex h-7 w-9 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-20"

/**
 * Subir / bajar, apilados en una columna angosta al borde de la fila.
 *
 * Flechas y no arrastrar: el editor se usa en el celular y con el pulgar, y un
 * drag adentro de un acordeón con scroll pelea con el gesto de desplazarse.
 * Además esto se navega con teclado sin trabajo extra.
 */
export function ReorderButtons({
  label,
  canUp,
  canDown,
  disabled,
  onMove,
}: {
  /** Qué se mueve, para el lector de pantalla: "ejercicio", "día", "semana". */
  label: string
  canUp: boolean
  canDown: boolean
  disabled?: boolean
  onMove: (dir: -1 | 1) => void
}) {
  return (
    <div className="flex shrink-0 flex-col self-center">
      <button
        type="button"
        aria-label={`Subir ${label}`}
        disabled={disabled || !canUp}
        onClick={() => onMove(-1)}
        className={BUTTON}
      >
        <ChevronUp className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Bajar ${label}`}
        disabled={disabled || !canDown}
        onClick={() => onMove(1)}
        className={BUTTON}
      >
        <ChevronDown className="size-3.5" />
      </button>
    </div>
  )
}

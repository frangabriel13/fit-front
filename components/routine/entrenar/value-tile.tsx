"use client"

import { type ReactNode } from "react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { cn } from "@/lib/utils"

/**
 * Celda grande y tipeable. Tocarla la vuelve el blanco del stepper compartido;
 * el número sigue siendo un <input> (tocás y escribís, foco selecciona todo)
 * para que cargar 82.5 no cueste quince toques. La enfocada se RELLENA con el
 * acento y el número se invierte: se ve de reojo, con el celular en el piso.
 */
export function ValueTile({
  label,
  value,
  active,
  inputMode,
  onInput,
  onFocus,
}: {
  label: ReactNode
  value: string
  active: boolean
  inputMode: "decimal" | "numeric"
  onInput: (raw: string) => void
  onFocus: () => void
}) {
  return (
    <div
      onClick={onFocus}
      className={cn(
        "rounded-2xl border px-4 pt-3 pb-3.5 transition-colors",
        active ? "border-primary bg-primary" : "border-hairline bg-surface"
      )}
    >
      <Eyebrow
        as="p"
        size="sm"
        className={cn(
          "font-semibold transition-colors",
          active ? "text-on-primary-soft" : "text-faint"
        )}
      >
        <span className="block truncate">{label}</span>
      </Eyebrow>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder="—"
        onChange={(e) => onInput(e.target.value)}
        onFocus={(e) => {
          onFocus()
          e.target.select()
        }}
        className={cn(
          "mt-1 w-full min-w-0 bg-transparent font-display text-[clamp(36px,11.8cqi,46px)] leading-none tracking-tight tabular-nums outline-none",
          active
            ? "text-primary-foreground caret-primary-foreground placeholder:text-on-primary-soft"
            : "text-foreground caret-primary placeholder:text-faint"
        )}
      />
    </div>
  )
}

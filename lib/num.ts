/**
 * Entrada numérica para formularios de carga.
 *
 * Los inputs guardan STRINGS y no números para que tipear decimales sea natural
 * —"57.", "1,25"— sin que el campo normalice mientras escribís. El parseo pasa
 * recién al operar con los botones o al confirmar.
 */

export const round2 = (n: number) => Math.round(n * 100) / 100

export const numStr = (n: number | null | undefined) =>
  n == null ? "" : String(n)

export const parseNum = (s: string): number | null => {
  if (s.trim() === "") return null
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Sanea entrada decimal: dígitos + una sola coma/punto. */
export const sanitizeDecimal = (raw: string): string => {
  const s = raw.replace(",", ".").replace(/[^0-9.]/g, "")
  const i = s.indexOf(".")
  return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "")
}

/** Sanea entrada entera: solo dígitos. */
export const sanitizeInt = (raw: string): string => raw.replace(/[^0-9]/g, "")

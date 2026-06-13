// Descansos de planilla: minutos con `'` y segundos con `''` (ej. "4'", "90''").

/** "4'" → 240 · "90''" → 90. Formato desconocido → 0 (sin descanso). */
export function parseRest(rest: string): number {
  // `''` antes que `'`: con el orden invertido "90''" matchearía como minutos.
  const m = rest.trim().match(/^(\d+)(''|')$/)
  if (!m) return 0
  return m[2] === "'" ? Number(m[1]) * 60 : Number(m[1])
}

/** 240 → "4:00" · 90 → "1:30" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

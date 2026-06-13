"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface RestTimer {
  /** Panel visible: corriendo o ya en 0 sin descartar. */
  active: boolean
  /** Llegó a 0. */
  finished: boolean
  /** Segundos restantes (ceil). */
  seconds: number
  /** Duración total, para la barra de progreso. */
  total: number
  start: (totalSeconds: number) => void
  /** Suma segundos; si ya terminó, revive el countdown. */
  extend: (delta?: number) => void
  /** Descarta el panel. */
  skip: () => void
}

const TICK_MS = 250

/**
 * Countdown anclado a timestamp (no a decrementos): sobrevive el throttling
 * de pestañas en background del navegador móvil. Date.now() solo corre en
 * handlers/intervalos, nunca en render (SSR-safe).
 */
export function useRestTimer(): RestTimer {
  const [active, setActive] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [total, setTotal] = useState(0)
  const endAtRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
    setSeconds(left)
    if (left === 0) {
      clear()
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(200)
      }
    }
  }, [clear])

  const run = useCallback(() => {
    clear()
    tick()
    intervalRef.current = setInterval(tick, TICK_MS)
  }, [clear, tick])

  const start = useCallback(
    (totalSeconds: number) => {
      endAtRef.current = Date.now() + totalSeconds * 1000
      setTotal(totalSeconds)
      setActive(totalSeconds > 0)
      if (totalSeconds > 0) run()
    },
    [run]
  )

  const extend = useCallback(
    (delta = 30) => {
      if (!active) return
      const base = Math.max(endAtRef.current, Date.now())
      endAtRef.current = base + delta * 1000
      setTotal((t) => t + delta)
      run()
    },
    [active, run]
  )

  const skip = useCallback(() => {
    clear()
    setActive(false)
    setSeconds(0)
  }, [clear])

  useEffect(() => clear, [clear])

  return {
    active,
    finished: active && seconds === 0,
    seconds,
    total,
    start,
    extend,
    skip,
  }
}

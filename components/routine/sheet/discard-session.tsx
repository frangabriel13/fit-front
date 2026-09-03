"use client"

import { Loader2, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * Descartar el día empezado (`DELETE /sessions/:id`).
 *
 * Es para el "la abrí sin querer": entrar a la pantalla de entrenamiento crea
 * la sesión, así que un toque de más deja el día marcado como en curso. Solo
 * aparece mientras la sesión siga ABIERTA — una terminada es historial y la API
 * responde 409.
 *
 * Va detrás de una confirmación que dice cuántos ejercicios se pierden: el
 * borrado se lleva las series cargadas y no hay forma de recuperarlas.
 */
export function DiscardSession({
  dayName,
  doneCount,
  onConfirm,
  pending,
}: {
  dayName: string
  doneCount: number
  onConfirm: () => void
  pending: boolean
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-hairline px-3.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:border-edge hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        Descartar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl leading-none uppercase">
            Descartar el día
          </AlertDialogTitle>
          <AlertDialogDescription>
            {doneCount > 0
              ? `Se van a perder los ${doneCount} ejercicios que cargaste hoy en ${dayName}. No se puede deshacer.`
              : `${dayName} vuelve a figurar como sin empezar.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Descartar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

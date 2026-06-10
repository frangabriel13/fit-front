"use client"

import { useState } from "react"
import { History, ChevronLeft } from "lucide-react"

import type { DayExercise } from "@/types/api"
import { useSessions, useSession } from "@/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface SessionHistorySheetProps {
  dayId: string
  exercises: DayExercise[]
}

export function SessionHistorySheet({
  dayId,
  exercises,
}: SessionHistorySheetProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: sessions, isLoading } = useSessions(dayId)
  const { data: selected, isLoading: loadingDetail } = useSession(
    open ? selectedId : null
  )

  const sorted = [...(sessions ?? [])].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSelectedId(null)
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="size-4" />
          Historial
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {selectedId ? "Sesión" : "Historial del día"}
          </SheetTitle>
          <SheetDescription>
            {selectedId
              ? "Detalle de la sesión seleccionada."
              : "Tus entrenamientos previos de este día."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!selectedId && (
            <>
              {isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              )}
              {!isLoading && sorted.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Todavía no hay sesiones registradas.
                </p>
              )}
              <div className="space-y-2">
                {sorted.map((session) => {
                  const done = session.setLogs.filter(
                    (l) => l.completed
                  ).length
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedId(session.id)}
                      className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-accent"
                    >
                      <span className="text-sm font-medium">
                        {formatDate(session.performedAt)}
                      </span>
                      <Badge variant="secondary">{done} series</Badge>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {selectedId && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => setSelectedId(null)}
              >
                <ChevronLeft className="size-4" />
                Volver al historial
              </Button>

              {loadingDetail && <Skeleton className="h-40 w-full" />}

              {selected && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selected.performedAt)}
                  </p>
                  {exercises.map((exercise) => {
                    const logs = selected.setLogs
                      .filter((l) => l.dayExerciseId === exercise.id)
                      .sort((a, b) => a.setNumber - b.setNumber)
                    if (logs.length === 0) return null
                    return (
                      <div key={exercise.id} className="space-y-1">
                        <p className="text-sm font-medium">{exercise.name}</p>
                        <div className="space-y-1">
                          {logs.map((log) => (
                            <div
                              key={log.id}
                              className="flex justify-between rounded border px-2 py-1 text-sm text-muted-foreground"
                            >
                              <span>Serie {log.setNumber}</span>
                              <span>
                                {log.actualReps ?? "—"} reps ·{" "}
                                {log.weight ?? "—"} kg · RIR{" "}
                                {log.actualRir ?? "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

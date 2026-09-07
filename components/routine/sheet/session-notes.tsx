"use client"

import { useState } from "react"
import { Loader2, NotebookPen } from "lucide-react"
import { toast } from "sonner"

import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateSession } from "@/hooks/use-sessions"

/** El tope que valida la API (`MaxLength(2000)`): pasarse es un 400. */
const MAX = 2000

/**
 * La nota del día: por qué el entrenamiento salió como salió.
 *
 * Va acá y no en la pantalla de entrenamiento porque no es un dato de una serie
 * sino del día entero, y porque al terminar se sale justo a esta pantalla. Es
 * además lo único de la sesión que el entrenador puede LEER de su cliente sin
 * que sean números — de ahí que en `readOnly` se muestre igual, solo que sin
 * forma de escribirla.
 *
 * Se puede escribir con el día ya cerrado, a diferencia de las series: cerrar
 * congela la medición, no el relato. Verificado contra la API.
 */
export function SessionNotes({
  sessionId,
  dayId,
  notes,
  readOnly = false,
}: {
  sessionId: string
  dayId: string
  notes: string | null | undefined
  readOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const update = useUpdateSession(sessionId, dayId)

  const saved = notes?.trim() ? notes : null

  // Sin nota y sin poder escribirla no hay nada que mostrar: un cartel vacío en
  // la vista del entrenador sería ruido en todos los días que nadie anotó.
  if (readOnly && !saved) return null

  function edit() {
    setDraft(saved ?? "")
    setEditing(true)
  }

  function save() {
    const value = draft.trim()
    update.mutate(
      // `null` y no `""` para borrarla: es la diferencia entre "sin nota" y
      // "una nota vacía", y la API guarda los dos tal cual se los manda.
      { notes: value === "" ? null : value },
      {
        onSuccess: () => setEditing(false),
        onError: () => toast.error("No se pudo guardar la nota."),
      }
    )
  }

  return (
    <div className="fade-up mt-5 rounded-2xl border border-hairline bg-surface px-4 py-3.5 [--delay:30ms] md:px-5">
      <Eyebrow as="p" tone="meta" className="flex items-center gap-2 text-faint">
        <NotebookPen className="size-3.5" />
        Nota del día
      </Eyebrow>

      {editing ? (
        <div className="mt-2.5 space-y-2.5">
          <Textarea
            autoFocus
            rows={3}
            maxLength={MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Cómo salió, qué molestó, con qué seguir la próxima."
            disabled={update.isPending}
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={save}
              disabled={update.isPending}
              className="h-9 px-4 text-[11px] font-semibold tracking-[0.16em] uppercase"
            >
              {update.isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={update.isPending}
              className="cursor-pointer font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground disabled:opacity-40"
            >
              Cancelar
            </button>
            {draft.length > MAX - 200 && (
              <span className="ml-auto font-mono text-[10px] tabular-nums text-faint">
                {MAX - draft.length}
              </span>
            )}
          </div>
        </div>
      ) : saved ? (
        <>
          {/* `whitespace-pre-line`: si alguien separó en renglones, se respetan. */}
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-foreground/90">
            {saved}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={edit}
              className="mt-2.5 cursor-pointer font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Editar
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={edit}
          className="mt-2 cursor-pointer text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Anotá cómo salió el día.
        </button>
      )}
    </div>
  )
}

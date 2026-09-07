"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { z } from "zod"

import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateExercise, useUpdateExercise } from "@/hooks/use-exercises"
import { exerciseSchema, type ExerciseValues } from "@/lib/schemas"
import type { DayExercise, DayExercisePayload } from "@/types/api"

interface ExerciseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  splitId: string
  dayId: string
  exercise?: DayExercise
  defaultOrder: number
}

/** Campo numérico corto de los objetivos; "" es "sin pautar", no cero. */
function NumField({
  control,
  name,
  label,
  placeholder = "—",
}: {
  control: ReturnType<typeof useForm<z.input<typeof exerciseSchema>, unknown, ExerciseValues>>["control"]
  name: keyof z.input<typeof exerciseSchema>
  label: string
  placeholder?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[11px] text-muted-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              placeholder={placeholder}
              {...field}
              value={(field.value as string | number | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ExerciseFormDialog({
  open,
  onOpenChange,
  splitId,
  dayId,
  exercise,
  defaultOrder,
}: ExerciseFormDialogProps) {
  const isEdit = !!exercise
  const create = useCreateExercise(splitId, dayId)
  const update = useUpdateExercise(splitId)
  const isPending = create.isPending || update.isPending

  // Vive acá y no en el schema porque no es un campo del ejercicio: es cómo
  // aplicar ESTE guardado.
  const [applyToAll, setApplyToAll] = useState(true)

  /**
   * Vuelve al valor por defecto al CERRAR y no al abrir: hacerlo al abrir sería
   * un `setState` adentro del efecto que rearma el formulario, y así el diálogo
   * nunca aparece arrastrando la decisión del renombre anterior.
   */
  function handleOpenChange(next: boolean) {
    if (!next) setApplyToAll(true)
    onOpenChange(next)
  }

  const form = useForm<z.input<typeof exerciseSchema>, unknown, ExerciseValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: "",
      order: defaultOrder,
      targetSets: 3,
      targetRestSeconds: "",
      targetRepsMin: "",
      targetRepsMax: "",
      targetRirMin: "",
      targetRirMax: "",
      toFailure: false,
      supersetGroup: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: exercise?.name ?? "",
        order: exercise?.order ?? defaultOrder,
        targetSets: exercise?.targetSets ?? 3,
        targetRestSeconds: exercise?.targetRestSeconds ?? "",
        targetRepsMin: exercise?.targetRepsMin ?? "",
        targetRepsMax: exercise?.targetRepsMax ?? "",
        targetRirMin: exercise?.targetRirMin ?? "",
        targetRirMax: exercise?.targetRirMax ?? "",
        toFailure: exercise?.toFailure ?? false,
        supersetGroup: exercise?.supersetGroup ?? "",
        notes: exercise?.notes ?? "",
      })
    }
  }, [open, exercise, defaultOrder, form])

  // `useWatch` y no `form.watch()`: el segundo devuelve una función que el
  // compilador de React no puede memoizar, y saltea la optimización del
  // componente entero.
  const [toFailure, rirMin, typedName] = useWatch({
    control: form.control,
    name: ["toFailure", "targetRirMin", "name"],
  })

  /**
   * Se está cambiando el nombre de un ejercicio que ya existe.
   *
   * Solo entonces aparece la opción de propagar: el progreso se agrupa por
   * NOMBRE (`history[ex.name]`) y un mesociclo repite los mismos ejercicios cada
   * semana, así que corregir un typo en una sola parte la serie histórica en dos
   * entradas y no lo delata nada hasta mirar el gráfico. Es una pregunta, no un
   * automatismo, porque cambiar una sola semana también es legítimo — en una
   * progresión la semana 3 puede pasar a sentadilla frontal.
   */
  const renaming =
    isEdit && !!typedName?.trim() && typedName.trim() !== exercise.name

  function onSubmit(values: ExerciseValues) {
    const payload: DayExercisePayload = values
    const onError = () => toast.error("No se pudo guardar el ejercicio.")
    const onSuccess = () => {
      toast.success(isEdit ? "Ejercicio actualizado" : "Ejercicio creado")
      handleOpenChange(false)
    }
    if (isEdit) {
      update.mutate(
        { id: exercise.id, ...payload, ...(renaming && { applyToAll }) },
        { onSuccess, onError }
      )
    } else {
      create.mutate(payload, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            {isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Sentadilla con barra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renaming && (
              <div className="fade-up space-y-2 rounded-lg border border-ember/25 bg-ember/10 px-3.5 py-3 [--delay:0ms]">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <Checkbox
                    checked={applyToAll}
                    onCheckedChange={(v) => setApplyToAll(v === true)}
                  />
                  <span className="text-[13px] leading-snug">
                    Renombrarlo en toda la rutina
                  </span>
                </label>
                <p className="font-mono text-[11px] leading-relaxed text-faint">
                  El progreso se agrupa por nombre. Sin esto,{" "}
                  <span className="text-ember">{exercise.name}</span> queda con
                  el historial partido: lo de antes por un lado y lo nuevo por
                  otro.
                </p>
              </div>
            )}

            <section className="space-y-3">
              <Eyebrow as="p" className="text-primary">
                Objetivos
              </Eyebrow>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  control={form.control}
                  name="targetSets"
                  label="Series"
                  placeholder="3"
                />
                <NumField
                  control={form.control}
                  name="targetRestSeconds"
                  label="Descanso (seg)"
                />
                <NumField
                  control={form.control}
                  name="targetRepsMin"
                  label="Reps mín."
                />
                <NumField
                  control={form.control}
                  name="targetRepsMax"
                  label="Reps máx."
                />
                <NumField
                  control={form.control}
                  name="targetRirMin"
                  label="RIR mín."
                />
                <NumField
                  control={form.control}
                  name="targetRirMax"
                  label="RIR máx."
                />
              </div>

              <FormField
                control={form.control}
                name="toFailure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Llevar al fallo
                    </FormLabel>
                  </FormItem>
                )}
              />
              {toFailure && (
                <p className="font-mono text-[11px] text-faint">
                  Con el fallo marcado, la planilla muestra{" "}
                  <span className="text-muted-foreground">
                    {rirMin === "" || rirMin == null ? "F" : `${rirMin}-F`}
                  </span>{" "}
                  y el RIR máximo no se usa.
                </p>
              )}
            </section>

            {/* La POSICIÓN no se escribe acá: se mueve con las flechas de la
                fila. Un número a mano convivía mal con eso —podía repetirse o
                contradecir lo que se ve— y ya no hace falta. */}
            <section className="space-y-3">
              <Eyebrow as="p" className="text-primary">
                Superserie
              </Eyebrow>
              <FormField
                control={form.control}
                name="supersetGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">
                      Grupo
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="—"
                        maxLength={10}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormDescription>
                Misma letra en ejercicios consecutivos = van encadenados
                (04A + 04B). Si quedan separados no se encadenan: acomodalos con
                las flechas.
              </FormDescription>
            </section>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opcional"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase"
              >
                {isPending && <Loader2 className="animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { z } from "zod"

import { exerciseSchema, type ExerciseValues } from "@/lib/schemas"
import { useCreateExercise, useUpdateExercise } from "@/hooks/use-exercises"
import type { DayExercise, DayExercisePayload } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface ExerciseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  splitId: string
  dayId: string
  exercise?: DayExercise
  defaultOrder: number
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

  const form = useForm<z.input<typeof exerciseSchema>, unknown, ExerciseValues>(
    {
      resolver: zodResolver(exerciseSchema),
      defaultValues: {
        name: "",
        order: defaultOrder,
        targetSets: 3,
        targetRestSeconds: "",
        targetRir: "",
        notes: "",
      },
    }
  )

  useEffect(() => {
    if (open) {
      form.reset({
        name: exercise?.name ?? "",
        order: exercise?.order ?? defaultOrder,
        targetSets: exercise?.targetSets ?? 3,
        targetRestSeconds: exercise?.targetRestSeconds ?? "",
        targetRir: exercise?.targetRir ?? "",
        notes: exercise?.notes ?? "",
      })
    }
  }, [open, exercise, defaultOrder, form])

  function onSubmit(values: ExerciseValues) {
    const payload: DayExercisePayload = values
    const onError = () => toast.error("No se pudo guardar el ejercicio.")
    const onSuccess = () => {
      toast.success(isEdit ? "Ejercicio actualizado" : "Ejercicio creado")
      onOpenChange(false)
    }
    if (isEdit) {
      update.mutate({ id: exercise!.id, ...payload }, { onSuccess, onError })
    } else {
      create.mutate(payload, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Press banca" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="targetSets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Series objetivo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetRestSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descanso (seg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        {...field}
                        value={(field.value as string | number | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetRir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RIR objetivo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        {...field}
                        value={(field.value as string | number | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              <Button type="submit" disabled={isPending}>
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

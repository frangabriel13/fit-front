"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { z } from "zod"

import { daySchema, type DayValues } from "@/lib/schemas"
import { useCreateDay, useUpdateDay } from "@/hooks/use-days"
import type { Day } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface DayFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  splitId: string
  microcycleId: string
  day?: Day
  defaultOrder: number
}

export function DayFormDialog({
  open,
  onOpenChange,
  splitId,
  microcycleId,
  day,
  defaultOrder,
}: DayFormDialogProps) {
  const isEdit = !!day
  const create = useCreateDay(splitId, microcycleId)
  const update = useUpdateDay(splitId)
  const isPending = create.isPending || update.isPending

  const form = useForm<z.input<typeof daySchema>, unknown, DayValues>({
    resolver: zodResolver(daySchema),
    defaultValues: { name: "", order: defaultOrder, focus: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: day?.name ?? "",
        order: day?.order ?? defaultOrder,
        focus: day?.focus ?? "",
      })
    }
  }, [open, day, defaultOrder, form])

  function onSubmit(values: DayValues) {
    const onError = () => toast.error("No se pudo guardar el día.")
    const onSuccess = () => {
      toast.success(isEdit ? "Día actualizado" : "Día creado")
      onOpenChange(false)
    }
    if (isEdit) {
      update.mutate({ id: day!.id, ...values }, { onSuccess, onError })
    } else {
      create.mutate(values, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            {isEdit ? "Editar día" : "Nuevo día"}
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
                    <Input placeholder="Día A · Pecho/Tríceps" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="focus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foco</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Glúteo · Cuádriceps"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Los grupos que se trabajan. Aparece debajo del nombre del
                    día en la planilla.
                  </FormDescription>
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

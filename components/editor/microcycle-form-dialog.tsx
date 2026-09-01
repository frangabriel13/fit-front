"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { z } from "zod"

import { microcycleSchema, type MicrocycleValues } from "@/lib/schemas"
import {
  useCreateMicrocycle,
  useUpdateMicrocycle,
} from "@/hooks/use-microcycles"
import type { Microcycle } from "@/types/api"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface MicrocycleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  splitId: string
  microcycle?: Microcycle
  defaultOrder: number
}

export function MicrocycleFormDialog({
  open,
  onOpenChange,
  splitId,
  microcycle,
  defaultOrder,
}: MicrocycleFormDialogProps) {
  const isEdit = !!microcycle
  const create = useCreateMicrocycle(splitId)
  const update = useUpdateMicrocycle(splitId)
  const isPending = create.isPending || update.isPending

  const form = useForm<
    z.input<typeof microcycleSchema>,
    unknown,
    MicrocycleValues
  >({
    resolver: zodResolver(microcycleSchema),
    defaultValues: { name: "", order: defaultOrder },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: microcycle?.name ?? "",
        order: microcycle?.order ?? defaultOrder,
      })
    }
  }, [open, microcycle, defaultOrder, form])

  function onSubmit(values: MicrocycleValues) {
    const onError = () => toast.error("No se pudo guardar la semana.")
    const onSuccess = () => {
      toast.success(isEdit ? "Semana actualizada" : "Semana creada")
      onOpenChange(false)
    }
    if (isEdit) {
      update.mutate({ id: microcycle!.id, ...values }, { onSuccess, onError })
    } else {
      create.mutate(values, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            {isEdit ? "Editar semana" : "Nueva semana"}
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
                    <Input placeholder="Semana 1" {...field} />
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

"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { z } from "zod"

import { splitSchema, type SplitValues } from "@/lib/schemas"
import { useCreateSplit, useUpdateSplit } from "@/hooks/use-splits"
import type { Split } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface SplitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  split?: Split
}

export function SplitFormDialog({
  open,
  onOpenChange,
  split,
}: SplitFormDialogProps) {
  const isEdit = !!split
  const create = useCreateSplit()
  const update = useUpdateSplit()
  const isPending = create.isPending || update.isPending

  const form = useForm<z.input<typeof splitSchema>, unknown, SplitValues>({
    resolver: zodResolver(splitSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: split?.name ?? "",
        description: split?.description ?? "",
      })
    }
  }, [open, split, form])

  function onSubmit(values: SplitValues) {
    const onError = () => toast.error("No se pudo guardar el split.")
    const onSuccess = () => {
      toast.success(isEdit ? "Split actualizado" : "Split creado")
      onOpenChange(false)
    }

    if (isEdit) {
      update.mutate({ id: split!.id, ...values }, { onSuccess, onError })
    } else {
      create.mutate(values, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar split" : "Nuevo split"}</DialogTitle>
          <DialogDescription>
            Una rutina con sus microciclos, días y ejercicios.
          </DialogDescription>
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
                    <Input placeholder="Push Pull Legs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
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

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { assignSplitSchema, type AssignSplitValues } from "@/lib/schemas"
import { useAssignSplit, useSplits } from "@/hooks/use-splits"
import { Button } from "@/components/ui/button"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AssignSplitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

/**
 * Asignarle al cliente una rutina que el entrenador ya tiene armada.
 *
 * Solo se ofrece cuando el cliente NO tiene ninguna: la API impide que tenga
 * dos (responde 409), y cambiársela es otro gesto — vive en el diálogo de la
 * rutina, donde se ve cuál tiene hoy.
 *
 * La lista no filtra las rutinas ya asignadas a otro: el invariante es que un
 * CLIENTE tiene una sola rutina, no que una rutina tenga un solo cliente, así
 * que reusar la misma plantilla en varios es válido.
 */
export function AssignSplitDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: AssignSplitDialogProps) {
  const { data: splits, isPending } = useSplits()
  const assign = useAssignSplit()

  const form = useForm<AssignSplitValues>({
    resolver: zodResolver(assignSplitSchema),
    defaultValues: { splitId: "" },
  })

  useEffect(() => {
    if (open) form.reset({ splitId: "" })
  }, [open, form])

  function onSubmit(values: AssignSplitValues) {
    assign.mutate(
      { id: values.splitId, clientId },
      {
        onSuccess: (split) => {
          toast.success(`${split.name} asignada a ${clientName}`)
          onOpenChange(false)
        },
        onError: (error) => {
          // No debería pasar: este diálogo solo se ofrece cuando el cliente no
          // tiene rutina. Pero entre que se pintó la pantalla y se apretó el
          // botón alguien pudo asignarle una desde otro lado.
          if ((error as AxiosError).response?.status === 409) {
            toast.error(
              `${clientName} ya tiene una rutina. Recargá para ver cuál.`
            )
            return
          }
          toast.error("No se pudo asignar la rutina.")
        },
      }
    )
  }

  const sinRutinas = !isPending && splits?.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            Asignar rutina
          </DialogTitle>
          <DialogDescription>
            {clientName} la va a ver en su pantalla de entrenamiento.
          </DialogDescription>
        </DialogHeader>

        {sinRutinas ? (
          <div className="py-2 text-sm text-muted-foreground">
            Todavía no tenés ninguna rutina armada.{" "}
            <Link
              href="/splits"
              className="text-primary underline-offset-4 hover:underline"
            >
              Crear una
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="splitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rutina</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isPending ? "Cargando…" : "Elegí una rutina"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {splits?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Se le puede sacar después desde el diálogo de la rutina.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={assign.isPending}>
                  {assign.isPending && <Loader2 className="animate-spin" />}
                  Asignar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

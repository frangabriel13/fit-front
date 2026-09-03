"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { Loader2, TriangleAlert, X } from "lucide-react"
import { toast } from "sonner"
import type { z } from "zod"

import { splitSchema, type SplitValues } from "@/lib/schemas"
import { useMe } from "@/hooks/use-auth"
import { useClients } from "@/hooks/use-clients"
import {
  useCreateSplit,
  useSplits,
  useUnassignSplit,
  useUpdateSplit,
} from "@/hooks/use-splits"
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

interface SplitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  split?: Split
}

/** El cliente que quedó trabado por el 409, con lo que se había tipeado. */
interface Conflict {
  clientId: string
  clientName: string
  values: SplitValues
}

export function SplitFormDialog({
  open,
  onOpenChange,
  split,
}: SplitFormDialogProps) {
  const isEdit = !!split
  const create = useCreateSplit()
  const update = useUpdateSplit()
  const unassign = useUnassignSplit()
  const isPending = create.isPending || update.isPending

  const { data: me } = useMe()
  const isTrainer = me?.role === "trainer"
  const { data: clients } = useClients(isTrainer)

  const [conflict, setConflict] = useState<Conflict | null>(null)
  // La rutina que ese cliente ya tiene. Se pide recién cuando hay conflicto:
  // el mensaje del 409 la nombra, pero es texto para humanos y no se parsea.
  const { data: ocupadas, isPending: buscandoOcupada } = useSplits(
    conflict?.clientId,
    !!conflict
  )
  const ocupada = ocupadas?.[0]

  const asignados = split?.clients ?? []
  const asignadosIds = new Set(asignados.map((c) => c.id))
  const disponibles = (clients ?? []).filter((c) => !asignadosIds.has(c.id))

  const form = useForm<z.input<typeof splitSchema>, unknown, SplitValues>({
    resolver: zodResolver(splitSchema),
    defaultValues: { name: "", description: "", clientId: "" },
  })

  useEffect(() => {
    if (open) {
      // `clientId` arranca vacío también al editar: el select SUMA un cliente,
      // no reemplaza. Los que ya están se manejan con sus chips, porque una
      // rutina puede estar asignada a varios a la vez.
      form.reset({
        name: split?.name ?? "",
        description: split?.description ?? "",
        clientId: "",
      })
    }
  }, [open, split, form])

  /**
   * El conflicto se limpia al CERRAR y no al abrir: hacerlo al abrir sería un
   * `setState` dentro del efecto, y así el diálogo nunca se muestra arrastrando
   * el aviso del intento anterior.
   */
  function handleOpenChange(next: boolean) {
    if (!next) setConflict(null)
    onOpenChange(next)
  }

  /** Guarda de verdad. Separado para poder reintentar tras desasignar. */
  function guardar(values: SplitValues, onConflict: (clientId: string) => void) {
    const onError = (error: unknown) => {
      if ((error as AxiosError).response?.status === 409 && values.clientId) {
        onConflict(values.clientId)
        return
      }
      toast.error("No se pudo guardar la rutina.")
    }
    const onSuccess = () => {
      toast.success(isEdit ? "Rutina actualizada" : "Rutina creada")
      handleOpenChange(false)
    }

    if (isEdit) {
      update.mutate({ id: split!.id, ...values }, { onSuccess, onError })
    } else {
      create.mutate(values, { onSuccess, onError })
    }
  }

  function onSubmit(values: SplitValues) {
    setConflict(null)
    guardar(values, (clientId) => {
      const c = clients?.find((x) => x.id === clientId)
      setConflict({
        clientId,
        clientName: c?.name ?? "Ese cliente",
        values,
      })
    })
  }

  /** Le saca la rutina que tenía y recién ahí guarda la nueva asignación. */
  function cambiarRutina() {
    if (!conflict || !ocupada) return
    unassign.mutate(
      { splitId: ocupada.id, clientId: conflict.clientId },
      {
        onSuccess: () => {
          const values = conflict.values
          setConflict(null)
          // El POST que devolvió 409 no creó nada —es atómico—, así que
          // reintentar la misma operación es seguro y no duplica la rutina.
          guardar(values, () => toast.error("No se pudo asignar la rutina."))
        },
        onError: () => toast.error("No se pudo liberar la rutina anterior."),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            {isEdit ? "Editar rutina" : "Nueva rutina"}
          </DialogTitle>
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

            {isTrainer && isEdit && asignados.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Asignada a</FormLabel>
                <ul className="flex flex-wrap gap-1.5">
                  {asignados.map((c) => (
                    <li key={c.id}>
                      <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface py-1 pr-1 pl-2.5 text-[13px]">
                        {c.name}
                        <button
                          type="button"
                          aria-label={`Sacarle la rutina a ${c.name}`}
                          disabled={unassign.isPending}
                          onClick={() =>
                            unassign.mutate(
                              { splitId: split!.id, clientId: c.id },
                              {
                                onSuccess: () =>
                                  toast.success(`${c.name} se quedó sin rutina`),
                                onError: () =>
                                  toast.error("No se pudo desasignar."),
                              }
                            )
                          }
                          className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isTrainer && disponibles.length > 0 && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEdit ? "Asignar a alguien más" : "Asignar a"}</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        setConflict(null)
                        field.onChange(v)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Elegí un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {disponibles.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Cada cliente tiene una sola rutina: si ya tiene otra, hay
                      que cambiársela.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {conflict && (
              <div
                role="alert"
                className="fade-up space-y-3 rounded-lg border border-ember/30 bg-ember/10 px-3.5 py-3 [--delay:0ms]"
              >
                <p className="flex items-start gap-2.5 text-[13px] leading-snug text-ember">
                  <TriangleAlert className="mt-px size-4 shrink-0" />
                  <span>
                    {conflict.clientName} ya entrena con{" "}
                    <strong className="font-semibold">
                      {buscandoOcupada
                        ? "otra rutina"
                        : `“${ocupada?.name ?? "otra rutina"}”`}
                    </strong>
                    . Se la podés cambiar por esta.
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={cambiarRutina}
                    disabled={!ocupada || unassign.isPending || isPending}
                    className="h-9 px-4 text-[11px] font-semibold tracking-[0.14em] uppercase"
                  >
                    {(unassign.isPending || isPending) && (
                      <Loader2 className="animate-spin" />
                    )}
                    Cambiársela
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setConflict(null)
                      form.setValue("clientId", "")
                    }}
                    className="h-9 px-4 text-[11px] tracking-[0.14em] uppercase"
                  >
                    Dejarla como está
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isPending || !!conflict}>
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

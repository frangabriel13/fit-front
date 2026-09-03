"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { clientEditSchema, type ClientEditValues } from "@/lib/schemas"
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients"
import type { User } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
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

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = editar; ausente = dar de alta. */
  client?: User
}

/**
 * Alta y edición de un cliente.
 *
 * En edición la contraseña es opcional y funciona como reset: cargarla pisa la
 * que tenga y deja al cliente con `mustChangePassword` otra vez, así que la app
 * le va a volver a pedir que elija una.
 */
export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: ClientFormDialogProps) {
  const isEdit = !!client
  const create = useCreateClient()
  const update = useUpdateClient()
  const isPending = create.isPending || update.isPending

  // Un solo schema con un refine condicional, y no dos schemas: dos tipos
  // distintos de zod rompen la inferencia del resolver. La contraseña es
  // opcional al editar —vacía = no tocarla— y obligatoria al dar de alta.
  const schema = useMemo(
    () =>
      clientEditSchema.refine((v) => isEdit || v.password.length >= 8, {
        message: "Mínimo 8 caracteres",
        path: ["password"],
      }),
    [isEdit]
  )

  const form = useForm<ClientEditValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "", password: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        email: client?.email ?? "",
        name: client?.name ?? "",
        password: "",
      })
    }
  }, [open, client, form])

  function onSubmit(values: ClientEditValues) {
    const onError = (error: unknown) => {
      // El 409 es el único error esperable acá: el resto de las validaciones ya
      // las cubre el schema, que copia los límites de la API. Va al campo y no
      // a un toast porque se arregla ahí mismo.
      if ((error as AxiosError).response?.status === 409) {
        form.setError("email", { message: "Ya hay una cuenta con ese email" })
        return
      }
      toast.error(
        isEdit ? "No se pudo guardar." : "No se pudo dar de alta al cliente."
      )
    }

    if (isEdit) {
      update.mutate(
        // Campo vacío = no tocar: se omite en vez de mandar "".
        { id: client!.id, ...values, password: values.password || undefined },
        {
          onSuccess: (c) => {
            toast.success(
              values.password
                ? `Contraseña de ${c.name} reseteada`
                : "Cliente actualizado"
            )
            onOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    create.mutate(
      values,
      {
        onSuccess: (c) => {
          toast.success(`${c.name} ya puede entrar`)
          onOpenChange(false)
        },
        onError,
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cambiá sus datos o reseteale la contraseña."
              : "Queda en tu cartera y entra con estos datos."}
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
                    <Input placeholder="Diamela" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="cliente@email.com"
                      {...field}
                      onChange={(e) => {
                        // El 409 lo puso este campo; al corregirlo, se va.
                        form.clearErrors("email")
                        field.onChange(e)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Con esto inicia sesión. Se puede corregir después.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit ? "Nueva contraseña" : "Contraseña provisoria"}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      defaultVisible
                      autoComplete="new-password"
                      placeholder={
                        isEdit ? "Dejala vacía para no tocarla" : "Mínimo 8 caracteres"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEdit
                      ? "Solo si necesita una nueva. Se la vas a tener que pasar vos, y la cambia al entrar."
                      : "Se la tenés que pasar vos. La cambia después desde su cuenta."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {isEdit ? "Guardar" : "Dar de alta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

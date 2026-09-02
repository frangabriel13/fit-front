"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { clientSchema, type ClientValues } from "@/lib/schemas"
import { useCreateClient } from "@/hooks/use-clients"
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
}

/**
 * Alta de un cliente por su entrenador.
 *
 * No hay edición: la API solo expone `POST /clients` y `GET /clients`. Tampoco
 * hay baja, así que el diálogo no ofrece ninguna de las dos.
 */
export function ClientFormDialog({
  open,
  onOpenChange,
}: ClientFormDialogProps) {
  const create = useCreateClient()

  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { email: "", name: "", password: "" },
  })

  useEffect(() => {
    if (open) form.reset({ email: "", name: "", password: "" })
  }, [open, form])

  function onSubmit(values: ClientValues) {
    create.mutate(values, {
      onSuccess: (client) => {
        toast.success(`${client.name} ya puede entrar`)
        onOpenChange(false)
      },
      onError: (error) => {
        // El 409 es el único error esperable acá: el resto de las validaciones
        // ya las cubre el schema, que copia los límites del `CreateClientDto`.
        // Va al campo y no a un toast porque se arregla ahí mismo.
        if ((error as AxiosError).response?.status === 409) {
          form.setError("email", {
            message: "Ya hay una cuenta con ese email",
          })
          return
        }
        toast.error("No se pudo dar de alta al cliente.")
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            Nuevo cliente
          </DialogTitle>
          <DialogDescription>
            Queda en tu cartera y entra con estos datos.
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
                    Con esto inicia sesión. Después no se puede cambiar.
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
                  <FormLabel>Contraseña provisoria</FormLabel>
                  <FormControl>
                    <PasswordInput
                      defaultVisible
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Se la tenés que pasar vos. La cambia después desde su cuenta.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="animate-spin" />}
                Dar de alta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

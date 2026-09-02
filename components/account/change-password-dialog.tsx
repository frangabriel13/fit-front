"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/schemas"
import { useChangePassword } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" }

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Cambio de contraseña propio, para cualquier rol.
 *
 * El error de la API va a un cartel arriba y no a un campo: un 400 puede ser
 * "la actual no es correcta" o una validación del server, y adivinar a cuál de
 * los tres campos corresponde sería marcar el equivocado. El mensaje que
 * devuelve la API ya viene en castellano y dirigido al usuario, así que se
 * muestra tal cual.
 */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const changePassword = useChangePassword()
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) form.reset(EMPTY)
  }, [open, form])

  /**
   * El error de la API se limpia al CERRAR y no al abrir: hacerlo al abrir
   * sería un `setState` dentro del efecto, y así el diálogo nunca se muestra
   * arrastrando el cartel del intento anterior.
   */
  function handleOpenChange(next: boolean) {
    if (!next) setApiError(null)
    onOpenChange(next)
  }

  function onSubmit(values: ChangePasswordValues) {
    setApiError(null)
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          // La sesión sigue viva: el token de antes del cambio no se invalida.
          toast.success("Contraseña cambiada")
          handleOpenChange(false)
        },
        onError: (error) => {
          const res = (error as AxiosError<{ message?: string }>).response
          setApiError(
            (res?.status === 400 && res.data?.message) ||
              "No se pudo cambiar la contraseña. Probá de nuevo."
          )
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none uppercase">
            Cambiar contraseña
          </DialogTitle>
          <DialogDescription>
            Mínimo 8 caracteres. Vas a seguir con la sesión abierta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div
                role="alert"
                className="fade-up flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-destructive [--delay:0ms]"
              >
                <TriangleAlert className="mt-px size-4 shrink-0" />
                <p className="text-[13px] leading-snug">{apiError}</p>
              </div>
            )}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                      onChange={(e) => {
                        setApiError(null)
                        field.onChange(e)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña nueva</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repetir la nueva</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

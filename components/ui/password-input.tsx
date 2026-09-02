"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  /**
   * Arrancar en texto plano. Lo usa el alta de clientes: la contraseña
   * provisoria la tiene que leer el entrenador para pasársela al cliente,
   * así que enmascararla no protege nada y solo estorba.
   */
  defaultVisible?: boolean
}

/**
 * Input de contraseña con botón de ver/ocultar.
 *
 * El formulario de login tiene el suyo, más cargado (aviso de Mayús, limpiar el
 * error de credenciales al tipear) y con el estilo propio de esa pantalla. Este
 * es el de los diálogos.
 */
export function PasswordInput({
  className,
  defaultVisible = false,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(defaultVisible)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-lg px-2.5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

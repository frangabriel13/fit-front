"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Dumbbell, KeyRound, LogOut } from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"

import { ChangePasswordDialog } from "@/components/account/change-password-dialog"
import { useLogout, useMe } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Chrome de la app. El acceso al editor de rutinas vive acá y no en el home
 * porque el home son dos puertas grandes por rol, y meter una tercera tarjeta
 * cambiaría esa decisión de diseño. El editor es una herramienta, no una puerta.
 *
 * Cerrar sesión pasó de ser un botón suelto a un ítem del menú de cuenta: hacen
 * falta dos acciones sobre la propia cuenta y dos íconos sueltos en una barra
 * de 56px de alto no entran bien en un celular.
 */
export function AppHeader() {
  const { data: user } = useMe()
  const logout = useLogout()
  const isTrainer = user?.role === "trainer"
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="size-5" />
          </span>
          <span className="font-display text-lg tracking-wide uppercase">
            Fit<span className="text-primary">Front</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isTrainer && (
            <Link
              href="/splits"
              className="rounded-lg px-2.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              Editar rutinas
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-1.5 px-2.5">
                <span
                  aria-hidden
                  className="flex size-6 items-center justify-center rounded-full bg-surface-raised font-mono text-[11px] text-muted-foreground uppercase"
                >
                  {user?.name?.[0] ?? "·"}
                </span>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user?.name}
                </span>
                {/* El nombre se oculta en pantalla angosta y ahí el botón
                    quedaría sin nombre accesible. Va como texto y no como
                    `aria-label` para que el accesible incluya al visible. */}
                <span className="sr-only">Mi cuenta</span>
                <ChevronDown className="size-3.5 text-faint" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-sm">{user?.name}</span>
                <span className="mt-0.5 block truncate font-mono text-[11px] text-faint">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="py-2"
                onSelect={() => setPasswordOpen(true)}
              >
                <KeyRound />
                Cambiar contraseña
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2"
                variant="destructive"
                onSelect={logout}
              >
                <LogOut />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* La contraseña la eligió el entrenador y se la pasó por fuera de la
          app. No se puede descartar el aviso a propósito: se va solo cuando
          la cambian, que es justo lo que queremos que pase.

          Va posicionado y no en flujo: adentro del header sumaba alto y
          corría hacia abajo todo lo que viene después —en el home las dos
          puertas se achicaban y una quedaba cortada—. Colgado del borde
          inferior del header, el contenido no se entera de que existe y se
          queda donde estaba. Por eso lleva fondo propio: lo que pasa por
          debajo al scrollear tiene que seguir siendo legible. */}
      {user?.mustChangePassword && (
        <div className="absolute inset-x-0 top-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="border-b border-ember/25 bg-ember/10">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 lg:px-6">
              <Eyebrow
                as="p"
                tone="meta"
                className="flex items-center gap-2 text-ember"
              >
                <KeyRound className="size-3.5" />
                Estás usando la contraseña que te pasaron
              </Eyebrow>
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="cursor-pointer font-mono text-[10px] font-semibold tracking-[0.16em] text-ember uppercase underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Cambiarla
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </header>
  )
}

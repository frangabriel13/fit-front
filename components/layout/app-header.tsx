"use client"

import Link from "next/link"
import { LogOut, Dumbbell } from "lucide-react"

import { useLogout, useMe } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

/**
 * Chrome de la app. El acceso al editor de rutinas vive acá y no en el home
 * porque el home son dos puertas grandes por rol, y meter una tercera tarjeta
 * cambiaría esa decisión de diseño. El editor es una herramienta, no una puerta.
 */
export function AppHeader() {
  const { data: user } = useMe()
  const logout = useLogout()
  const isTrainer = user?.role === "trainer"

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
          {user?.name && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

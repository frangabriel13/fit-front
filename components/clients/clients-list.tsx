"use client"

import Link from "next/link"
import { ArrowRight, UserRound } from "lucide-react"

import { Notice } from "@/components/feedback/notice"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-auth"
import { useClients } from "@/hooks/use-clients"

function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[76px] w-full" />
      <Skeleton className="h-[76px] w-full" />
    </div>
  )
}

/**
 * La cartera del entrenador. Cada cliente abre su rutina.
 *
 * El rol se chequea ANTES de pedir los datos, y no solo por prolijidad: la API
 * responde 401 a un `client`, y el interceptor de lib/api trata cualquier 401
 * como sesión vencida — borra el token y manda a /login. Pedir esto sin ser
 * trainer desloguearía al usuario.
 */
export function ClientsList() {
  const { data: me, isPending: loadingMe } = useMe()
  const isTrainer = me?.role === "trainer"

  const { data: clients, isPending, isError } = useClients(isTrainer)

  if (loadingMe) return <Loading />

  if (!isTrainer)
    return (
      <Notice>
        Esta sección es solo para entrenadores.{" "}
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </Notice>
    )

  if (isPending) return <Loading />
  if (isError) return <Notice>No se pudieron cargar los clientes.</Notice>
  if (clients.length === 0)
    return <Notice>Todavía no tenés clientes asignados.</Notice>

  return (
    <ul className="space-y-2">
      {clients.map((c, i) => (
        <li key={c.id}>
          <Link
            href="/rutina"
            style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}
            className="fade-up group flex items-center gap-4 rounded-2xl border border-hairline bg-surface px-4 py-4 transition-colors hover:border-edge"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-muted-foreground transition-colors group-hover:text-primary">
              <UserRound className="size-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg leading-none uppercase">
                {c.name}
              </span>
              <span className="mt-1.5 block truncate font-mono text-[12px] text-faint">
                {c.email}
              </span>
            </span>

            <Eyebrow
              tone="action"
              className="hidden items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-primary sm:inline-flex"
            >
              Ver rutina
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Eyebrow>
          </Link>
        </li>
      ))}
    </ul>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, UserRound, UsersRound } from "lucide-react"

import { ClientFormDialog } from "@/components/clients/client-form-dialog"
import { Notice } from "@/components/feedback/notice"
import { Eyebrow } from "@/components/typography/eyebrow"
import { Button } from "@/components/ui/button"
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
 * El rol se chequea ANTES de pedir los datos: la API responde 403 a un
 * `client`, y aunque un 403 no cierra la sesión (solo el 401 lo hace), pedir
 * algo que ya sabemos que va a fallar no tiene sentido.
 */
export function ClientsList() {
  const { data: me, isPending: loadingMe } = useMe()
  const isTrainer = me?.role === "trainer"

  const { data: clients, isPending, isError } = useClients(isTrainer)
  const [createOpen, setCreateOpen] = useState(false)

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

  return (
    <>
      <div className="fade-up mb-5 flex items-center justify-between gap-4">
        <Eyebrow as="p" tone="meta" className="text-faint">
          {clients
            ? `${clients.length} ${clients.length === 1 ? "cliente" : "clientes"}`
            : " "}
        </Eyebrow>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-5 text-[11px] font-semibold tracking-[0.16em] uppercase"
        >
          <Plus className="size-3.5" />
          Nuevo cliente
        </Button>
      </div>

      {isPending && <Loading />}

      {isError && <Notice>No se pudieron cargar los clientes.</Notice>}

      {clients && clients.length === 0 && (
        <Notice>
          <UsersRound className="mx-auto size-7 text-faint" />
          <p className="mt-3 font-display text-lg text-foreground uppercase">
            Todavía no tenés clientes
          </p>
          <p className="mt-1">
            Dalos de alta acá y después asignales una rutina.
          </p>
        </Notice>
      )}

      {clients && clients.length > 0 && (
        <ul className="space-y-2">
          {clients.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
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
      )}

      <ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}

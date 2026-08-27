import type { Metadata } from "next"

import { ClientsList } from "@/components/clients/clients-list"
import { AppHeader } from "@/components/layout/app-header"
import { Eyebrow } from "@/components/typography/eyebrow"

export const metadata: Metadata = {
  title: "Mis clientes · FitFront",
}

export default function ClientesPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 lg:px-6 lg:py-12">
        <div className="fade-up mb-8">
          <Eyebrow as="p" className="font-semibold text-primary">
            Entrenador
          </Eyebrow>
          <h1 className="mt-1.5 font-display text-4xl leading-none uppercase lg:text-5xl">
            Mis clientes
          </h1>
        </div>

        <ClientsList />
      </main>
    </>
  )
}

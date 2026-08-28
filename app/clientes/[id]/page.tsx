import type { Metadata } from "next"

import { ClientDetail } from "@/components/clients/client-detail"
import { AppHeader } from "@/components/layout/app-header"

export const metadata: Metadata = {
  title: "Cliente · FitFront",
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <ClientDetail clientId={id} />
      </main>
    </>
  )
}

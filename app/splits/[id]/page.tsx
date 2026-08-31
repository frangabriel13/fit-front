import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { SplitEditor } from "@/components/editor/split-editor"

export const metadata: Metadata = {
  title: "Editar rutina · FitFront",
}

export default async function SplitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <SplitEditor splitId={id} />
      </main>
    </>
  )
}

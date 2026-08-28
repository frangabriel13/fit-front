import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { ProgressScreen } from "@/components/progress/progress-screen"

export const metadata: Metadata = {
  title: "Mi progreso · FitFront",
}

export default function ProgresoPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-16 md:pt-8 lg:px-6 lg:pt-10">
        <ProgressScreen />
      </main>
    </>
  )
}

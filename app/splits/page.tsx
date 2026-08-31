import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { SplitsGrid } from "@/components/splits/splits-grid"

export const metadata: Metadata = {
  title: "Mis rutinas · FitFront",
}

export default function SplitsPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <SplitsGrid />
      </main>
    </>
  )
}

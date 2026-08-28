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
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <SplitsGrid />
      </main>
    </>
  )
}

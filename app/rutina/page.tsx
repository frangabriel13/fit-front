import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { RoutineScreen } from "@/components/routine/routine-screen"

export const metadata: Metadata = {
  title: "Mi rutina · FitFront",
}

export default function RutinaPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-32 md:pt-8 md:pb-10 lg:px-6 lg:pt-10">
        <RoutineScreen />
      </main>
    </>
  )
}

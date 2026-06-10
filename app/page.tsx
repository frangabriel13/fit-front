import { AppHeader } from "@/components/layout/app-header"
import { SplitsGrid } from "@/components/splits/splits-grid"

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <SplitsGrid />
      </main>
    </>
  )
}

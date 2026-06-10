import { AppHeader } from "@/components/layout/app-header"
import { WorkoutScreen } from "@/components/workout/workout-screen"

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string; dayId: string }>
}) {
  const { id, dayId } = await params

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <WorkoutScreen splitId={id} dayId={dayId} />
      </main>
    </>
  )
}

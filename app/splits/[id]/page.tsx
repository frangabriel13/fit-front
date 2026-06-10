import { AppHeader } from "@/components/layout/app-header"
import { SplitEditor } from "@/components/editor/split-editor"

export default async function SplitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <SplitEditor splitId={id} />
      </main>
    </>
  )
}

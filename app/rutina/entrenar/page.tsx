import type { Metadata } from "next"

import { TrainView } from "@/components/routine/train-view"

export const metadata: Metadata = {
  title: "Entrenando · FitFront",
}

export default function EntrenarPage() {
  return <TrainView />
}

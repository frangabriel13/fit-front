import type { Metadata } from "next"

import { EntrenarClient } from "@/components/routine/entrenar-client"

export const metadata: Metadata = {
  title: "Entrenando · FitFront",
}

// Wrapper de servidor: solo expone metadata. Toda la pantalla de entrenamiento
// vive en EntrenarClient porque ahora maneja estado local (steppers editables,
// completar/omitir series). Persistencia real ⇒ cuando se cablee a la API.
export default function EntrenarPage() {
  return <EntrenarClient />
}

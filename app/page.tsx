import { LineChart, Dumbbell } from "lucide-react"

import { AppHeader } from "@/components/layout/app-header"
import { SectionCard } from "@/components/home/section-card"
import { exerciseState, ROUTINE, SESSION } from "@/lib/routine-data"

export default function DashboardPage() {
  const sessionDay = ROUTINE.days.find((d) => d.id === SESSION.dayId)
  const doneCount = sessionDay
    ? sessionDay.exercises.filter(
        (e) => exerciseState(SESSION.logs[e.name]) === "done"
      ).length
    : 0

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col lg:flex-row">
        <SectionCard
          href="/progreso"
          eyebrow="Seguimiento"
          title="Mi progreso"
          cta="Ver progreso"
          icon={LineChart}
          image="/follow.jpeg"
          imageAlt="Personas entrenando en cintas de correr en el gimnasio"
          imagePosition="object-[45%_52%]"
          index="01"
        />
        <SectionCard
          href="/rutina"
          eyebrow="Entrenamiento"
          title="Mi rutina"
          cta="Ver rutina"
          icon={Dumbbell}
          image="/rutine.jpeg"
          imageAlt="Entrenando en el gimnasio"
          imagePosition="object-[50%_92%]"
          index="02"
          status={
            sessionDay
              ? `en curso · ${doneCount} de ${sessionDay.exercises.length}`
              : undefined
          }
          className="border-t border-border lg:border-t-0 lg:border-l"
          delay="120ms"
        />
      </main>
    </>
  )
}

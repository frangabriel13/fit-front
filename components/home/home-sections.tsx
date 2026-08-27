"use client"

import { Dumbbell, LineChart, Users } from "lucide-react"

import { SectionCard } from "@/components/home/section-card"
import { useMe } from "@/hooks/use-auth"

/**
 * Las dos puertas de entrada de la app, según quién entró.
 *
 *   trainer →  Mis clientes · Mi rutina
 *   client  →  Mi progreso  · Mi rutina
 *
 * El rol llega de /auth/me, o sea del cliente. Mientras carga se reserva el
 * hueco de la primera card en vez de asumir un rol: adivinar y corregir haría
 * parpadear la card equivocada, y el salto de layout se nota en una pantalla
 * que es toda foto.
 */
export function HomeSections() {
  const { data: me, isPending } = useMe()
  const isTrainer = me?.role === "trainer"

  return (
    <main className="group/home flex flex-1 flex-col lg:flex-row">
      {isPending ? (
        <div
          aria-hidden
          className="min-h-[46vh] flex-1 animate-pulse bg-card/30 lg:min-h-0"
        />
      ) : isTrainer ? (
        <SectionCard
          href="/clientes"
          eyebrow="Entrenador"
          title="Mis clientes"
          cta="Ver clientes"
          icon={Users}
          image="/follow.jpeg"
          imageAlt="Personas entrenando en el gimnasio"
          imagePosition="object-[45%_52%]"
          index="01"
          accent="ember"
        />
      ) : (
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
          accent="ember"
        />
      )}

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
        accent="primary"
        className="border-t border-white/10 lg:border-t-0 lg:border-l"
        delay="120ms"
      />
    </main>
  )
}

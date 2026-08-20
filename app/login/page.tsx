import type { Metadata } from "next"
import { Dumbbell } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Iniciar sesión · FitFront",
}

/* Se renderiza dos veces: dentro del panel de marca en desktop y al pie de
   la pantalla en mobile, donde la ficha se solapa sobre la banda de marca. */
function BrandFooter({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="h-px w-full bg-gradient-to-r from-white/15 to-transparent" />
      <p className="mt-3 text-[10px] tracking-[0.18em] text-muted-foreground uppercase lg:mt-4 lg:text-[11px]">
        <span className="sm:hidden">Rutinas · Modo entrenamiento</span>
        <span className="hidden sm:inline">
          Rutinas · Microciclos · Modo entrenamiento · Historial
        </span>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Panel de marca */}
      <section className="relative flex flex-col justify-between gap-6 overflow-hidden px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-14 sm:px-10 lg:min-h-dvh lg:w-[55%] lg:gap-12 lg:px-14 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -left-40 size-[520px] rounded-full bg-primary/20 blur-[160px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 -bottom-56 size-[420px] rounded-full bg-primary/10 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(118deg,transparent_0,transparent_52px,rgba(255,255,255,0.04)_52px,rgba(255,255,255,0.04)_53px)] [mask-image:linear-gradient(118deg,black,transparent_72%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-16 h-[2px] w-[160%] origin-left rotate-[28deg] bg-gradient-to-r from-primary/50 via-primary/15 to-transparent blur-[1px]"
        />

        <header className="fade-up relative flex items-center gap-2 lg:gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_24px_-4px] shadow-primary/60 lg:size-9">
            <Dumbbell className="size-4 lg:size-5" />
          </span>
          <span className="font-display text-lg tracking-wide uppercase lg:text-xl">
            Fit<span className="text-primary">Front</span>
          </span>
        </header>

        <div className="relative flex gap-4 lg:gap-7">
          <div
            aria-hidden
            className="fade-up w-0.5 shrink-0 rounded-full bg-gradient-to-b from-primary via-primary/15 via-62% to-transparent [--delay:140ms]"
          />
          <div>
            <p className="fade-up mb-3 font-mono text-[11px] font-medium tracking-[0.3em] text-primary uppercase lg:mb-6 [--delay:100ms]">
              Tu entrenamiento, en serio
            </p>
            <h1 className="font-display text-[52px] leading-[0.95] uppercase sm:text-7xl xl:text-8xl">
              <span className="fade-up block [--delay:180ms]">Entrená.</span>
              <span className="fade-up block text-transparent [-webkit-text-stroke:1.5px_rgba(245,247,246,0.4)] [--delay:280ms]">
                Progresá.
              </span>
              <span className="fade-up block text-primary [--delay:380ms]">
                Repetí.
              </span>
            </h1>
          </div>
        </div>

        <BrandFooter className="fade-up hidden lg:block [--delay:480ms]" />
      </section>

      {/* Panel de formulario */}
      <section className="relative -mt-8 flex flex-1 flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] lg:mt-0 lg:items-center lg:justify-center lg:border-l lg:border-white/10 lg:bg-card/40 lg:px-10 lg:py-14">
        <div className="w-full max-w-[420px]">
          <div className="fade-up relative overflow-hidden rounded-xl border border-white/10 bg-card p-6 shadow-[0_24px_60px_-30px] shadow-black/90 sm:p-8 [--delay:200ms]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            />

            <p className="font-mono text-[10px] font-semibold tracking-[0.25em] text-primary uppercase">
              Acceso privado
            </p>
            <h2 className="mt-2.5 font-display text-[28px] leading-none uppercase sm:text-3xl">
              Iniciar sesión
            </h2>
            <p className="mt-2.5 text-[13px] text-muted-foreground sm:text-sm">
              Entrá con el email y la contraseña que te asignaron.
            </p>

            <div className="mt-6 sm:mt-7">
              <LoginForm />
            </div>
          </div>

          <p className="fade-up mt-6 text-center text-xs text-muted-foreground/70 [--delay:320ms]">
            ¿Problemas para entrar? Hablá con tu entrenador.
          </p>
        </div>

        <BrandFooter className="fade-up mt-auto pt-10 lg:hidden [--delay:480ms]" />
      </section>
    </main>
  )
}

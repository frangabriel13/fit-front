import type { Metadata } from "next"
import { Dumbbell } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión · FitFront",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Panel de marca */}
      <section className="relative flex flex-col justify-between gap-6 overflow-hidden px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-6 sm:px-10 lg:min-h-dvh lg:w-[55%] lg:gap-12 lg:px-14 lg:py-12">
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

        <div className="relative">
          <p className="fade-up mb-3 font-mono text-[11px] font-medium tracking-[0.3em] text-primary uppercase lg:mb-6 [--delay:100ms]">
            Tu entrenamiento, en serio
          </p>
          <h1 className="font-display text-5xl leading-[0.95] uppercase sm:text-7xl xl:text-8xl">
            <span className="fade-up block [--delay:180ms]">Entrená.</span>
            <span className="fade-up block text-transparent [-webkit-text-stroke:1.5px_rgba(245,247,246,0.4)] [--delay:280ms]">
              Progresá.
            </span>
            <span className="fade-up block text-primary [--delay:380ms]">
              Repetí.
            </span>
          </h1>
        </div>

        <footer className="fade-up relative [--delay:480ms]">
          <div className="h-px w-full bg-gradient-to-r from-white/15 to-transparent" />
          <p className="mt-3 text-[10px] tracking-[0.18em] text-muted-foreground uppercase lg:mt-4 lg:text-[11px]">
            <span className="sm:hidden">Rutinas · Modo entrenamiento</span>
            <span className="hidden sm:inline">
              Rutinas · Microciclos · Modo entrenamiento · Historial
            </span>
          </p>
        </footer>
      </section>

      {/* Panel de formulario */}
      <section className="relative flex flex-1 items-center justify-center border-t border-white/10 bg-card/40 px-6 pt-7 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] lg:border-t-0 lg:border-l lg:px-10 lg:py-14">
        <div className="w-full max-w-sm">
          <div className="fade-up [--delay:200ms]">
            <p className="font-mono text-[10px] font-semibold tracking-[0.25em] text-primary uppercase">
              Acceso privado
            </p>
            <h2 className="mt-2 font-display text-3xl leading-none uppercase">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Entrá con el email y la contraseña que te asignaron.
            </p>
          </div>

          <div className="fade-up mt-6 lg:mt-8 [--delay:300ms]">
            <LoginForm />
          </div>

          <p className="fade-up mt-6 text-center text-xs text-muted-foreground/70 lg:mt-8 [--delay:400ms]">
            ¿Problemas para entrar? Hablá con tu entrenador.
          </p>
        </div>
      </section>
    </main>
  )
}

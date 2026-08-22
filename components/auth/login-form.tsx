"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import {
  ArrowBigUp,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  TriangleAlert,
} from "lucide-react"

import { Eyebrow } from "@/components/typography/eyebrow"
import { loginSchema, type LoginValues } from "@/lib/schemas"
import { useLogin } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function LoginForm() {
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginValues) {
    setAuthError(null)
    login.mutate(values, {
      onError: (error) => {
        const status = (error as AxiosError).response?.status
        setAuthError(
          status === 401
            ? "Email o contraseña incorrectos."
            : "No se pudo iniciar sesión. Probá de nuevo."
        )
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {authError && (
          <div
            role="alert"
            className="fade-up flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-destructive [--delay:0ms]"
          >
            <TriangleAlert className="mt-px size-4 shrink-0" />
            <p className="text-[13px] leading-snug">{authError}</p>
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="vos@email.com"
                  className="h-12 border-white/10 bg-white/[0.03] px-3.5 placeholder:text-muted-foreground/40 focus-visible:border-primary/45 focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px] focus-visible:shadow-primary/10"
                  {...field}
                  onChange={(e) => {
                    setAuthError(null)
                    field.onChange(e)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Contraseña
                </FormLabel>
                {capsLock && (
                  <Eyebrow
                    role="status"
                    tone="meta"
                    className="hidden items-center gap-1 text-ember sm:flex"
                  >
                    <ArrowBigUp className="size-3" />
                    Mayús activado
                  </Eyebrow>
                )}
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 border-white/10 bg-white/[0.03] px-3.5 pr-12 placeholder:text-muted-foreground/40 focus-visible:border-primary/45 focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px] focus-visible:shadow-primary/10"
                    {...field}
                    onChange={(e) => {
                      setAuthError(null)
                      field.onChange(e)
                    }}
                    onKeyUp={(e) =>
                      setCapsLock(e.getModifierState("CapsLock"))
                    }
                    onKeyDown={(e) =>
                      setCapsLock(e.getModifierState("CapsLock"))
                    }
                    onBlur={() => {
                      setCapsLock(false)
                      field.onBlur()
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-lg px-3 text-[oklch(0.55_0.06_248)] transition-colors outline-none hover:text-[oklch(0.7_0.08_244)] focus-visible:text-[oklch(0.7_0.08_244)]"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="h-12 w-full text-[13px] font-semibold tracking-[0.16em] uppercase shadow-[0_8px_30px_-8px] shadow-primary/50 transition-shadow hover:shadow-primary/70"
          disabled={login.isPending}
        >
          {login.isPending && <Loader2 className="animate-spin" />}
          Ingresar
          {!login.isPending && (
            <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />
          )}
        </Button>
      </form>
    </Form>
  )
}

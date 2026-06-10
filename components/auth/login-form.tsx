"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AxiosError } from "axios"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"

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
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginValues) {
    login.mutate(values, {
      onError: (error) => {
        const status = (error as AxiosError).response?.status
        toast.error(
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
                  className="h-11 border-white/10 bg-white/[0.03] px-3.5 placeholder:text-muted-foreground/40"
                  {...field}
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
              <FormLabel className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Contraseña
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 border-white/10 bg-white/[0.03] px-3.5 pr-11 placeholder:text-muted-foreground/40"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-lg px-3 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
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
          className="h-11 w-full text-[13px] font-semibold tracking-[0.16em] uppercase shadow-[0_8px_30px_-8px] shadow-primary/50 transition-shadow hover:shadow-primary/70"
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

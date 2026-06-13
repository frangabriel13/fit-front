"use client"

import { Check, Loader2, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

export function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus
  onRetry: () => void
}) {
  if (status === "error") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        className="h-7 gap-1.5 text-destructive"
      >
        <AlertCircle className="size-4" />
        Reintentar
      </Button>
    )
  }

  const map: Record<
    Exclude<SaveStatus, "error">,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    idle: { label: "", icon: null, className: "" },
    dirty: {
      label: "Sin guardar",
      icon: null,
      className: "text-muted-foreground",
    },
    saving: {
      label: "Guardando…",
      icon: <Loader2 className="size-3.5 animate-spin" />,
      className: "text-muted-foreground",
    },
    saved: {
      label: "Guardado",
      icon: <Check className="size-3.5" />,
      className: "text-primary",
    },
  }

  const { label, icon, className } = map[status]
  if (!label) return <span className="h-7" />

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 text-xs font-medium",
        className
      )}
    >
      {icon}
      {label}
    </span>
  )
}

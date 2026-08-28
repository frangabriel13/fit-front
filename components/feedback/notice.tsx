/** Aviso al centro de una sección: vacío, error o acceso denegado. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-edge p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

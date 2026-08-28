// Fábrica centralizada de query keys de React Query.

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  clients: {
    all: ["clients"] as const,
  },
  // El usuario al que se refieren los datos entra en la clave: un entrenador
  // mira su propia rutina y la de cada cliente en la misma sesión, y sin esto
  // compartirían caché.
  splits: {
    all: (clientId?: string) => ["splits", clientId ?? "me"] as const,
    detail: (id: string) => ["split", id] as const,
  },
  sessions: {
    byDay: (dayId: string, userId?: string) =>
      ["sessions", "day", dayId, userId ?? "me"] as const,
    detail: (id: string) => ["session", id] as const,
  },
  progress: {
    forSplit: (splitId: string, userId?: string) =>
      ["progress", splitId, userId ?? "me"] as const,
  },
}

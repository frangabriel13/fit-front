// Fábrica centralizada de query keys de React Query.

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  clients: {
    all: ["clients"] as const,
  },
  splits: {
    all: ["splits"] as const,
    detail: (id: string) => ["split", id] as const,
  },
  sessions: {
    byDay: (dayId: string) => ["sessions", "day", dayId] as const,
    detail: (id: string) => ["session", id] as const,
  },
}

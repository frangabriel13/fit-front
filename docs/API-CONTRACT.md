# Contrato de API — FitFront

Este documento describe **la API que el frontend consume**. Ya no es una
propuesta: el frontend está conectado al backend real y todas las pantallas
leen de acá. Cada endpoint y forma de respuesta está verificado contra
`http://localhost:3003`.

**Fuente de verdad de los tipos:** `types/api.ts` del repo del frontend.
Copiarlo tal cual y derivar de ahí los DTOs de NestJS es lo más seguro.

---

## 0. Cómo se conecta el frontend

En `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3003   # base de la API
NEXT_PUBLIC_USE_MOCKS=false                 # mocks apagados
```

Con `false`, `lib/mocks/` no intercepta nada y todas las llamadas salen a
`NEXT_PUBLIC_API_URL`. La capa de mocks queda solo como implementación de
referencia de `/auth/*` para trabajar sin backend.

**CORS:** el frontend corre en `http://localhost:3002`. Habilitar ese origen.

---

## 1. Reglas globales

**Envoltorio de respuesta: NINGUNO.** El helper `unwrap()` devuelve
`response.data` directo. Un `GET /splits` debe responder el array pelado
`[{...}]`, **no** `{ "data": [...] }`.

**Autenticación:** JWT en header. El frontend adjunta
`Authorization: Bearer <accessToken>` en **todas** las llamadas si hay token.
El token se guarda en una cookie no-httpOnly (`fitfront_token`), pero **la API
no debe depender de la cookie** — el token viaja solo en el header.

**⚠️ Códigos de error — esto importa mucho:**

| código | significado | qué hace el frontend |
|---|---|---|
| **401** | No autenticado / token vencido o inválido | **Borra el token y redirige a `/login`** |
| **403** | Autenticado, pero sin permiso para este recurso | Muestra el error. **No cierra la sesión.** |

Devolver 401 donde corresponde 403 **desloguea al usuario**. Para "sos un
`client` y esto es de `trainer`" → **403**.

**Formato de error:** `{ "message": string }` (lo que ya devuelve NestJS por
defecto). El frontend no parsea más que el status.

---

## 2. Endpoints

Todos requieren `Authorization` salvo `POST /auth/login`.

### Auth

| método | path | body | respuesta |
|---|---|---|---|
| `POST` | `/auth/login` | `LoginPayload` | `LoginResponse` |
| `GET` | `/auth/me` | — | `User` |

`POST /auth/login` con credenciales inválidas → **401**.

### Clientes

| método | path | body | respuesta |
|---|---|---|---|
| `GET` | `/clients` | — | `User[]` |

La cartera del entrenador logueado: los `User` con `role: "client"` a su cargo.
Si quien llama **no** es `trainer` → **403** (no 401, ver arriba).

> El modelo de "qué cliente pertenece a qué entrenador" todavía no existe en el
> frontend. Definilo del lado del backend; el frontend solo consume la lista.

### Splits (rutinas)

| método | path | body | respuesta |
|---|---|---|---|
| `GET` | `/splits` | — | `Split[]` |
| `GET` | `/splits/:id` | — | `Split` |
| `POST` | `/splits` | `SplitPayload` | `Split` |
| `PATCH` | `/splits/:id` | `Partial<SplitPayload>` | `Split` |
| `DELETE` | `/splits/:id` | — | — |

`GET /splits/:id` debe venir **anidado completo**:
`Split → microcycles[] → days[] → exercises[]`. La pantalla de entrenamiento
busca el día dentro de esa estructura, no hace una llamada aparte.

### Microciclos

| método | path | body | respuesta |
|---|---|---|---|
| `POST` | `/splits/:splitId/microcycles` | `MicrocyclePayload` | `Microcycle` |
| `PATCH` | `/microcycles/:id` | `Partial<MicrocyclePayload>` | `Microcycle` |
| `DELETE` | `/microcycles/:id` | — | — |

### Días

| método | path | body | respuesta |
|---|---|---|---|
| `POST` | `/microcycles/:microcycleId/days` | `DayPayload` | `Day` |
| `PATCH` | `/days/:id` | `Partial<DayPayload>` | `Day` |
| `DELETE` | `/days/:id` | — | — |

### Ejercicios del día

| método | path | body | respuesta |
|---|---|---|---|
| `POST` | `/days/:dayId/exercises` | `DayExercisePayload` | `DayExercise` |
| `PATCH` | `/exercises/:id` | `Partial<DayExercisePayload>` | `DayExercise` |
| `DELETE` | `/exercises/:id` | — | — |

### Sesiones de entrenamiento

| método | path | body | respuesta |
|---|---|---|---|
| `GET` | `/days/:dayId/sessions` | — | `WorkoutSession[]` |
| `GET` | `/sessions/:id` | — | `WorkoutSession` |
| `POST` | `/days/:dayId/sessions` | `{}` | `WorkoutSession` |
| `PUT` | `/sessions/:id/set-logs` | `{ setLogs: SetLogUpsert[] }` | `WorkoutSession` |
| `PATCH` | `/set-logs/:id` | `SetLogPatch` | `SetLog` |
| `DELETE` | `/set-logs/:id` | — | 204 |

**Detalles que el frontend asume:**

- `POST /days/:dayId/sessions` se llama con **body vacío `{}`**. El backend pone
  `performedAt` (ISO 8601). Debe devolver la sesión creada completa.
- El frontend decide si "hay sesión de hoy" comparando `performedAt` contra el
  día del navegador (`hooks/use-active-session.ts`). Mandá `performedAt` en ISO
  con zona, no solo fecha.
- **`PUT /sessions/:id/set-logs` es un UPSERT en lote.** La clave natural es
  `(sessionId, dayExerciseId, setNumber)`: si existe se actualiza, si no se
  crea. **No** es un reemplazo total — los set-logs que no vengan en el body
  deben quedar intactos. Debe devolver la `WorkoutSession` completa con todos
  sus `setLogs`.
- Ese PUT se dispara con debounce de 800 ms mientras el usuario tipea, y de
  inmediato al marcar una serie como completada. Tiene que aguantar llamadas
  seguidas y ser idempotente.
- Campos numéricos ausentes (`actualReps`, `actualRir`, `weight`) significan
  "sin dato" → guardar `NULL`, no `0`.
- **`DELETE /set-logs/:id` es lo que hace que "resetear" funcione.** Un upsert
  no puede expresar "esta serie nunca pasó": dejarla en `completed: false` la
  volvería a mostrar a medio llenar. El modo entrenamiento borra la fila.
- **`skipped`** distingue "omitida a propósito" de "todavía sin hacer".
  `completed: false, skipped: true` = omitida; ausente en la base = pendiente.

### Progreso del macrociclo

| método | path | query | respuesta |
|---|---|---|---|
| `GET` | `/splits/:splitId/progress` | `userId?` | `SplitProgress` |

Posición en el macrociclo (`week` / `totalWeeks`) más el historial por
ejercicio, en una sola llamada: el gráfico de progresión necesita las dos cosas
a la vez, porque la semana en curso es lo que distingue "hoy" de lo ya cerrado.

- El historial se correlaciona **por nombre** de ejercicio entre semanas.
  Renombrar un ejercicio a mitad del macrociclo parte su historial en dos.
- `weeks` es **denso desde la semana 1** (índice 0 = Semana 1) y **NO incluye la
  semana en curso**: esa sale de la sesión viva. Mandarla rompe el gráfico, que
  distingue "semana pasada" de "hoy" justamente por la ausencia.
- Solo aparecen los ejercicios con al menos una semana registrada. Una rutina
  recién empezada devuelve `exercises: []`, y el frontend muestra el vacío.

---

## 3. Tipos

Copiar de `types/api.ts`. Resumen:

```ts
type UserRole = "trainer" | "client"

interface User { id: string; email: string; name: string; role: UserRole }

interface DayExercise {
  id: string; name: string; order: number; targetSets: number
  targetRestSeconds?: number | null
  targetRir?: number | null
  notes?: string | null
  targetRepsMin?: number | null      // rango de reps: 10 a 12
  targetRepsMax?: number | null
  targetRirMin?: number | null       // rango de esfuerzo
  targetRirMax?: number | null
  toFailure?: boolean                // al fallo
  supersetGroup?: string | null      // mismo valor = encadenados (04A + 04B)
}

interface Day {
  id: string; name: string; order: number
  focus?: string | null              // "Glúteo · Cuádriceps"
  exercises: DayExercise[]
}
interface Microcycle { id: string; name: string; order: number; days: Day[] }
interface Split { id: string; name: string; description?: string | null; microcycles: Microcycle[] }

interface SetLog {
  id: string; dayExerciseId: string; setNumber: number
  actualReps?: number | null
  actualRir?: number | null
  weight?: number | null
  completed: boolean
  skipped?: boolean                  // omitida a propósito
}

interface WorkoutSession {
  id: string; dayId: string; performedAt: string   // ISO 8601
  notes?: string | null
  setLogs: SetLog[]
}

interface LoginResponse { accessToken: string; user: User }
interface LoginPayload { email: string; password: string }
interface SplitPayload { name: string; description?: string }
interface MicrocyclePayload { name: string; order: number }
interface DayPayload { name: string; order: number }
interface DayExercisePayload {
  name: string; order: number; targetSets: number
  targetRestSeconds?: number; targetRir?: number; notes?: string
}
interface SetLogUpsert {
  dayExerciseId: string; setNumber: number
  actualReps?: number; actualRir?: number; weight?: number
  completed: boolean
  skipped?: boolean
}
interface SetLogPatch {
  actualReps?: number; actualRir?: number; weight?: number
  completed?: boolean; skipped?: boolean
}

// Progreso del macrociclo
interface HistorySet { weight: number; reps: number; rir: number | null }
interface ExerciseHistory { name: string; weeks: HistorySet[][] }
interface SplitProgress {
  splitId: string; week: number; totalWeeks: number
  exercises: ExerciseHistory[]
}
```

**Cómo los usa el frontend.** Los números del contrato se traducen a la
tipografía de planilla en `lib/plan.ts`, que es puro y está probado contra
datos reales:

| campo(s) | se muestra |
|---|---|
| `targetRepsMin/Max` | `8-10`, o `10` si son iguales |
| `targetRirMin/Max` + `toFailure` | `1-2`, `0-F`, o `F` |
| `targetRestSeconds` | `75''` por debajo de 2 min, `2'30''` por encima |
| `supersetGroup` | numeración `04A` / `04B` y la flecha de encadenado |

`order` es un entero para ordenar; el frontend ordena por él (`a.order - b.order`).

---

## 4. Lo que queda abierto

Ya no hay pantallas mockeadas: `/rutina`, `/rutina/entrenar` y `/progreso` leen
de la API igual que `/splits/*`, y `lib/routine-data.ts` está borrado. El
entrenador ve la rutina y el progreso de cada cliente en `/clientes/[id]`,
usando los filtros por usuario.

**Los filtros por usuario no se llaman igual en todos lados.** Es la misma
persona en los tres casos:

| endpoint | parámetro |
|---|---|
| `GET /splits` | `clientId` |
| `GET /splits/:id/progress` | `userId` |
| `GET /days/:dayId/sessions` | `userId` |

`hooks/use-plan.ts` lo absorbe con un solo argumento, pero unificar el nombre
del lado del backend ahorraría la próxima confusión.

Lo que sigue sin resolver:

**Alcance de las sesiones — inconsistente entre listado y detalle.** Con el
token del entrenador:

```
GET /days/<día>/sessions            → []          (filtrado por usuario)
GET /sessions/<sesión de un cliente> → 200 + body  (sin filtrar)
```

El detalle no aplica el criterio del listado. Hoy no rompe nada visible —la
vista del entrenador es de solo lectura y nunca crea sesiones—, pero es una
fuga: con el id de una sesión se lee entera sin pasar por el filtro. Hay que
decidir cuál de las dos respuestas es la correcta y alinear la otra.

**Escribir en nombre de un cliente.** No existe y probablemente esté bien así:
`useActiveSession` solo abre sesiones del usuario logueado, a propósito. Si
alguna vez un entrenador tiene que cargar series por su cliente, hace falta
definir quién queda como autor de la sesión.

**Varias rutinas asignadas.** `hooks/use-plan.ts` toma la **primera** de
`GET /splits`. Si un usuario puede tener más de una activa a la vez, hace falta
un selector — y probablemente una marca de "activa" en el modelo.

**`SplitDto` no dice a quién está asignada la rutina.** El editor ya puede
asignar (`POST /splits` y `PATCH /splits/:id` con `clientId`), pero no puede
**mostrar** el resultado: la respuesta trae `id`, `name`, `description` y
`microcycles`, y nada de las asignaciones. Consecuencias hoy:

- `/splits` no puede decir "Rutina de Diamela"; todas se ven iguales.
- Al editar, el selector de cliente arranca vacío a propósito — preseleccionar
  sería inventar un dato que la API no dio.

Alcanzaría con agregar el cliente asignado (id y nombre) a `SplitDto`.

**No hay forma de desasignar.** Mandar `clientId` hace un upsert que asigna o
reactiva; no existe el camino inverso. Verificado: renombrar una rutina sin
mandar `clientId` no toca las asignaciones, que es lo que hace seguro el
diálogo de edición.

---

## 5. Sobre seguridad, para no arrastrar el atajo del mock

Hoy `proxy.ts` (el middleware de Next) **solo chequea que la cookie exista**, no
que el token sea válido. Es un atajo del período sin backend. Con la API real,
la validación tiene que estar del lado del backend en cada request — el
frontend ya está preparado: cualquier 401 limpia la sesión.

Las credenciales mock de `lib/mocks/auth-mock.ts` son de desarrollo y **no
deben migrar** a ninguna seed de producción.

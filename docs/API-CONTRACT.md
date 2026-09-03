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
```

Es la única variable. Ya no hay capa de mocks: todas las llamadas salen a
`NEXT_PUBLIC_API_URL` y sin la API levantada la app no funciona.

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
| `POST` | `/auth/change-password` | `ChangePasswordPayload` | 204 |

`POST /auth/login` con credenciales inválidas → **401**.

`POST /auth/change-password` con la contraseña actual equivocada → **400**, no
401: equivocarse al tipear no puede costar la sesión. El token emitido antes del
cambio sigue siendo válido. Este endpoint es lo único que apaga
`User.mustChangePassword`.

### Clientes

| método | path | body | respuesta |
|---|---|---|---|
| `GET` | `/clients` | — | `User[]` |
| `POST` | `/clients` | `ClientPayload` | `User` |
| `PATCH` | `/clients/:id` | `ClientPatch` | `User` |
| `DELETE` | `/clients/:id` | — | 204 |

La cartera del entrenador logueado: los `User` con `role: "client"` a su cargo.
Si quien llama **no** es `trainer` → **403** (no 401, ver arriba).

- El alta deja al cliente con `mustChangePassword: true`: la contraseña la
  elige el entrenador y se la pasa por fuera de la app.
- En el PATCH, **campo ausente = no tocar**. El email se normaliza solo
  (minúsculas, sin espacios) y uno ya usado → **409**. Un id que no es de tu
  cartera → **404**.
- `password` en el PATCH es el reset del entrenador: pisa la que haya y vuelve
  a prender `mustChangePassword`.
- La baja es **lógica**: conserva el historial y corta el acceso en el acto. Si
  ese cliente tenía sesión abierta en otro dispositivo, su próximo request es
  401 y el front lo desloguea.

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
| `PATCH` | `/sessions/:id` | `SessionPatch` | `WorkoutSession` |
| `DELETE` | `/sessions/:id` | — | 204 |
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
- **`PATCH /sessions/:id` con `completed: true` cierra el día** con la hora del
  server; `false` lo reabre. Es idempotente: cerrar dos veces conserva la hora
  del primer cierre. Cerrarla es lo que vuelve comparable lo cargado — mientras
  `completedAt` sea `null` la sesión es parcial y `lib/progression.ts` no la usa
  para medir la tendencia.
- **`DELETE /sessions/:id` solo funciona con la sesión ABIERTA**; una cerrada es
  historial y responde **409**. Es para el "la abrí sin querer y me quedó el día
  empezado": entrar a la pantalla de entrenamiento crea la sesión.
- El tope del upsert son **500 series por llamada**; pasarse → 400.

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

interface User {
  id: string; email: string; name: string; role: UserRole
  mustChangePassword: boolean        // usa la provisoria que puso el entrenador
}

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
interface SplitClient { id: string; name: string }
interface Split {
  id: string; name: string; description?: string | null
  clients: SplitClient[]             // a quién está asignada; puede ser más de uno
  microcycles: Microcycle[]
}

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
  completedAt: string | null         // null = abierta; cerrada = comparable
  notes?: string | null
  setLogs: SetLog[]
}

interface LoginResponse { accessToken: string; user: User }
interface LoginPayload { email: string; password: string }
interface SplitPayload { name: string; description?: string; clientId?: string }
interface ClientPayload { email: string; name: string; password: string }
interface ClientPatch { name?: string; email?: string; password?: string }
interface ChangePasswordPayload { currentPassword: string; newPassword: string }
interface SessionPatch { notes?: string; completed?: boolean }
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

**Cerrado en la ronda del 2 de septiembre de 2026.** El backend resolvió los
ocho puntos que estaban abiertos: un cliente tiene una sola rutina y la API lo
hace cumplir (409), se pueden cerrar y borrar sesiones, `SplitDto` informa las
asignaciones, hay baja y corrección de clientes, `mustChangePassword` viaja en
`User`, `userId` y `clientId` son alias en los tres endpoints que filtran por
persona, y el 400 del upsert de series ya nombra el problema real.

Lo que sigue sin resolver:

**Alcance de las sesiones — inconsistente entre listado y detalle.** Con el
token del entrenador:

```
GET /days/<día>/sessions             → solo las propias  (filtra por usuario)
GET /sessions/<sesión de un cliente> → 200 + body        (sin filtrar)
```

El detalle no aplica el criterio del listado. Hoy no rompe nada visible —la
vista del entrenador es de solo lectura y nunca crea sesiones—, pero es una
fuga: con el id de una sesión se lee entera sin pasar por el filtro. Hay que
decidir cuál de las dos respuestas es la correcta y alinear la otra.

**Una sesión cerrada sigue aceptando escrituras.** `PUT /sessions/:id/set-logs`,
`PATCH /set-logs/:id` y `DELETE /set-logs/:id` funcionan igual con la sesión
cerrada; solo `DELETE /sessions/:id` responde 409. Probablemente esté bien
—permite corregir una carga después de terminar— pero convive mal con la idea
de "historial": lo que se agregue después cuenta como definitivo sin que nada
lo distinga. El front lo compensa avisando en pantalla que el día está cerrado
y ofreciendo reabrirlo, pero la decisión es del backend.

**Una rutina puede tener varios clientes.** El invariante que la API garantiza
es de una sola dirección: un CLIENTE tiene una sola rutina, pero la misma
rutina se puede asignar a varios a la vez. Es razonable —sirve de plantilla—
pero conviene que sea una decisión explícita y no un efecto: si alguna vez se
quiere 1 a 1, hay que impedirlo del lado del server. El front ya lo trata como
lista (`Split.clients`) y no como un solo cliente.

**Escribir en nombre de un cliente.** No existe y probablemente esté bien así:
`useActiveSession` solo abre sesiones del usuario logueado, a propósito. Si
alguna vez un entrenador tiene que cargar series por su cliente, hace falta
definir quién queda como autor de la sesión.

---

## 5. Sobre seguridad, para no arrastrar el atajo del mock

`proxy.ts` (el middleware de Next) **solo chequea que la cookie exista**, y así
tiene que quedarse: es un redirect barato para no pintar el shell de la app a
quien no inició sesión, no una autenticación. La validación real la hace el
backend en cada request, y el interceptor de `lib/api.ts` limpia la sesión ante
cualquier 401.

Nada en la app trata la cookie como prueba de identidad: el usuario y su rol
salen siempre de `GET /auth/me`. Y la cookie dura lo mismo que el JWT (7 días
las dos), así que no hay ventana en la que un token vencido siga abriendo
pantallas.

Las credenciales de desarrollo viven en la seed del backend y **no deben migrar**
a producción.
